"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useMap } from "react-map-gl/mapbox";
import { MapStatus, useLayerIds, useMapStatus } from "@/app/[locale]/url-store";
import { interactiveLayerAtom } from "@/containers/map/store";
import MapPopup from "@/containers/map/tooltip/popup";
import MapPopupItem from "@/containers/map/tooltip/popup/item";
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

interface StyleMeta {
  interactionConfig: InteractionConfig;
  layerTitle: Translatable;
  legendConfig: LayerConfig["legend_config"] | undefined;
}

const MapTooltip = () => {
  const { current: map } = useMap();
  const { layerIds } = useLayerIds();
  const { mapStatus } = useMapStatus();
  const [interactiveLayer, setInteractiveLayer] = useAtom(interactiveLayerAtom);
  const { getTranslation } = useApiTranslation();

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

      const feature = features[0];
      const styleId = feature.layer?.id;
      if (!styleId) return;
      const meta = mapboxIdToMeta.get(styleId);
      if (!meta) return;

      const properties: Record<string, unknown> = {};
      for (const key of meta.interactionConfig.keys) {
        properties[key] = feature.properties?.[key] ?? null;
      }

      const legendItems =
        meta.legendConfig?.type === "basic" ? meta.legendConfig.items : null;

      setInteractiveLayer({
        layerId: styleId,
        layerTitle: meta.layerTitle,
        legendItems,
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        type: meta.interactionConfig.type,
        properties,
      });
    },
    [map, mapboxLayerIds, mapboxIdToMeta, setInteractiveLayer, mapStatus],
  );

  const handleMouseEnter = useCallback(() => {
    if (map && mapStatus !== MapStatus.upload)
      map.getCanvas().style.cursor = "pointer";
  }, [map, mapStatus]);

  const handleMouseLeave = useCallback(() => {
    if (map && mapStatus !== MapStatus.upload)
      map.getCanvas().style.cursor = "";
  }, [map, mapStatus]);

  useEffect(() => {
    if (!map || mapboxLayerIds.length === 0) return;

    map.on("click", handleClick);
    for (const id of mapboxLayerIds) {
      map.on("mouseenter", id, handleMouseEnter);
      map.on("mouseleave", id, handleMouseLeave);
    }
    return () => {
      map.off("click", handleClick);
      for (const id of mapboxLayerIds) {
        map.off("mouseenter", id, handleMouseEnter);
        map.off("mouseleave", id, handleMouseLeave);
      }
    };
  }, [map, mapboxLayerIds, handleClick, handleMouseEnter, handleMouseLeave]);

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
