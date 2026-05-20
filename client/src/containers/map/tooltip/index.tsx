"use client";

import { useQuery } from "@tanstack/react-query";
import { booleanPointInPolygon, point } from "@turf/turf";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useMap } from "react-map-gl/mapbox";
import { MapStatus, useLayerIds, useMapStatus } from "@/app/[locale]/url-store";
import { interactiveLayerAtom } from "@/containers/map/store";
import MapPopup from "@/containers/map/tooltip/popup";
import MapPopupItem from "@/containers/map/tooltip/popup/item";
import { useHblAreaRaw } from "@/hooks/use-hbl-area";
import { useApiTranslation } from "@/i18n/api-translation";
import { API } from "@/lib/api";
import { getLayersConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type {
  InteractionConfig,
  LayerConfig,
  LayersResponse,
  Translatable,
} from "@/types";

const HBL_RESTRICTED_LAYER_ID = "indigenous-territories-fill";

interface StyleMeta {
  interactionConfig: InteractionConfig;
  layerTitle: Translatable;
  legendConfig: LayerConfig["legend_config"] | undefined;
}

function extractFeatureProperties(
  feature: mapboxgl.MapboxGeoJSONFeature,
  keys: string[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const key of keys) {
    properties[key] = feature.properties?.[key] ?? null;
  }
  return properties;
}

const MapTooltip = () => {
  const { current: map } = useMap();
  const { layerIds } = useLayerIds();
  const { mapStatus } = useMapStatus();
  const [interactiveLayer, setInteractiveLayer] = useAtom(interactiveLayerAtom);
  const { getTranslation } = useApiTranslation();
  const { data: hblArea } = useHblAreaRaw();

  const { data: layers } = useQuery({
    queryKey: queryKeys.layers.all.queryKey,
    queryFn: () => API<LayersResponse>(getLayersConfig),
    select: (data) => data.data,
  });

  const { mapboxLayerIds, mapboxIdToMeta } = useMemo(() => {
    const ids: string[] = [];
    const metaMap = new Map<string, StyleMeta>();

    if (!layers) return { mapboxLayerIds: ids, mapboxIdToMeta: metaMap };

    for (const layer of layers) {
      if (!layerIds.includes(layer.id) || !layer.config?.interaction_config) {
        continue;
      }

      const meta: StyleMeta = {
        interactionConfig: layer.config.interaction_config,
        layerTitle: layer.metadata.title,
        legendConfig: layer.config.legend_config,
      };
      const styles = layer.config.styles;

      if (styles.length > 0) {
        for (let i = 0; i < styles.length; i++) {
          const styleId =
            styles[i].id ?? (i === 0 ? layer.id : `${layer.id}-${i}`);
          ids.push(styleId);
          metaMap.set(styleId, meta);
        }
      } else {
        ids.push(layer.id);
        metaMap.set(layer.id, meta);
      }
    }

    return { mapboxLayerIds: ids, mapboxIdToMeta: metaMap };
  }, [layers, layerIds]);

  const handleClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      if (!map || mapboxLayerIds.length === 0 || mapStatus === MapStatus.upload)
        return;

      const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5],
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: mapboxLayerIds,
      });

      if (!features || features.length === 0) {
        setInteractiveLayer(null);
        return;
      }

      const topFeature = features[0];
      const styleId = topFeature.layer?.id;
      if (!styleId) return;
      const meta = mapboxIdToMeta.get(styleId);
      if (!meta) return;

      if (styleId === HBL_RESTRICTED_LAYER_ID && hblArea) {
        const clickPoint = point([e.lngLat.lng, e.lngLat.lat]);
        if (!booleanPointInPolygon(clickPoint, hblArea)) {
          setInteractiveLayer(null);
          return;
        }
      }

      const { interactionConfig } = meta;
      const legendItems =
        meta.legendConfig?.type === "basic" ? meta.legendConfig.items : null;

      let featureList: { properties: Record<string, unknown> }[];

      if (interactionConfig.multi && interactionConfig.dedup_key) {
        const seen = new Set<unknown>();
        featureList = [];
        for (const f of features) {
          if (f.layer?.id !== styleId) continue;
          const dedupValue = f.properties?.[interactionConfig.dedup_key];
          if (seen.has(dedupValue)) continue;
          seen.add(dedupValue);
          featureList.push({
            properties: extractFeatureProperties(f, interactionConfig.keys),
          });
        }
      } else {
        featureList = [
          {
            properties: extractFeatureProperties(
              topFeature,
              interactionConfig.keys,
            ),
          },
        ];
      }

      setInteractiveLayer({
        layerId: styleId,
        layerTitle: meta.layerTitle,
        legendItems,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        type: interactionConfig.type,
        features: featureList,
      });
    },
    [
      map,
      mapboxLayerIds,
      mapboxIdToMeta,
      setInteractiveLayer,
      mapStatus,
      hblArea,
    ],
  );

  const handleMouseEnter = useCallback(() => {
    if (map && mapStatus !== MapStatus.upload)
      map.getCanvas().style.cursor = "pointer";
  }, [map, mapStatus]);

  const handleMouseLeave = useCallback(() => {
    if (map && mapStatus !== MapStatus.upload)
      map.getCanvas().style.cursor = "";
  }, [map, mapStatus]);

  const handleRestrictedMouseMove = useCallback(
    (e: mapboxgl.MapLayerMouseEvent) => {
      if (!map || mapStatus === MapStatus.upload) return;
      if (
        hblArea &&
        booleanPointInPolygon(point([e.lngLat.lng, e.lngLat.lat]), hblArea)
      ) {
        map.getCanvas().style.cursor = "pointer";
      } else {
        map.getCanvas().style.cursor = "";
      }
    },
    [map, mapStatus, hblArea],
  );

  useEffect(() => {
    if (!map || mapboxLayerIds.length === 0) return;

    map.on("click", handleClick);
    for (const id of mapboxLayerIds) {
      if (id === HBL_RESTRICTED_LAYER_ID) {
        map.on("mousemove", id, handleRestrictedMouseMove);
      } else {
        map.on("mouseenter", id, handleMouseEnter);
      }
      map.on("mouseleave", id, handleMouseLeave);
    }
    return () => {
      map.off("click", handleClick);
      for (const id of mapboxLayerIds) {
        if (id === HBL_RESTRICTED_LAYER_ID) {
          map.off("mousemove", id, handleRestrictedMouseMove);
        } else {
          map.off("mouseenter", id, handleMouseEnter);
        }
        map.off("mouseleave", id, handleMouseLeave);
      }
    };
  }, [
    map,
    mapboxLayerIds,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleRestrictedMouseMove,
  ]);

  useEffect(() => {
    if (mapStatus === MapStatus.upload) {
      setInteractiveLayer(null);
    }
  }, [mapStatus, setInteractiveLayer]);

  useEffect(() => {
    if (
      interactiveLayer &&
      !mapboxLayerIds.includes(interactiveLayer.layerId)
    ) {
      setInteractiveLayer(null);
    }
  }, [interactiveLayer, mapboxLayerIds, setInteractiveLayer]);

  if (!interactiveLayer) return null;

  return (
    <MapPopup
      key={`${interactiveLayer.layerId}-${interactiveLayer.longitude}-${interactiveLayer.latitude}`}
      longitude={interactiveLayer.longitude}
      latitude={interactiveLayer.latitude}
      onClose={() => setInteractiveLayer(null)}
      title={getTranslation(interactiveLayer.layerTitle)}
    >
      <MapPopupItem />
    </MapPopup>
  );
};

export default MapTooltip;
