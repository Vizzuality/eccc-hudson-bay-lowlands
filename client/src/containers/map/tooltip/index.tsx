"use client";

import { useQuery } from "@tanstack/react-query";
import { booleanPointInPolygon, point } from "@turf/turf";
import { useAtom } from "jotai";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import {
  MapStatus,
  useLayerIds,
  useMapStatus,
  useSyncLayersSettings,
} from "@/app/[locale]/url-store";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  type InteractiveLayerEntry,
  interactiveLayerAtom,
} from "@/containers/map/store";
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
  dataLayerId: string;
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
  const { layersSettings } = useSyncLayersSettings();
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
        dataLayerId: layer.id,
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

      const clickPoint = point([e.lngLat.lng, e.lngLat.lat]);

      const grouped = new Map<string, mapboxgl.MapboxGeoJSONFeature[]>();
      for (const f of features) {
        const id = f.layer?.id;
        if (!id) continue;
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id)?.push(f);
      }

      const layerEntries: InteractiveLayerEntry[] = [];

      for (const [styleId, styleFeatures] of grouped) {
        const meta = mapboxIdToMeta.get(styleId);
        if (!meta) continue;

        if (styleId === HBL_RESTRICTED_LAYER_ID && hblArea) {
          if (!booleanPointInPolygon(clickPoint, hblArea)) continue;
        }

        const { interactionConfig } = meta;
        const legendItems =
          meta.legendConfig?.type === "basic" ? meta.legendConfig.items : null;

        let featureList: { properties: Record<string, unknown> }[];

        if (interactionConfig.multi && interactionConfig.dedup_key) {
          const seen = new Set<unknown>();
          featureList = [];
          for (const f of styleFeatures) {
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
                styleFeatures[0],
                interactionConfig.keys,
              ),
            },
          ];
        }

        layerEntries.push({
          layerId: styleId,
          dataLayerId: meta.dataLayerId,
          layerTitle: meta.layerTitle,
          legendItems,
          type: interactionConfig.type,
          features: featureList,
        });
      }

      if (layerEntries.length === 0) {
        setInteractiveLayer(null);
        return;
      }

      setInteractiveLayer({
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
        layers: layerEntries,
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
    if (!interactiveLayer) return;
    const remaining = interactiveLayer.layers.filter((l) => {
      if (!mapboxLayerIds.includes(l.layerId)) return false;
      const visibility =
        (layersSettings?.[l.dataLayerId]?.visibility as boolean) ?? true;
      return visibility;
    });
    if (remaining.length === 0) {
      setInteractiveLayer(null);
    } else if (remaining.length !== interactiveLayer.layers.length) {
      setInteractiveLayer({
        ...interactiveLayer,
        layers: remaining,
      });
    }
  }, [interactiveLayer, mapboxLayerIds, layersSettings, setInteractiveLayer]);

  if (!interactiveLayer) return null;

  const { layers: interactiveLayers } = interactiveLayer;

  if (interactiveLayers.length === 1) {
    const layer = interactiveLayers[0];
    return (
      <MapPopup
        key={`${layer.layerId}-${interactiveLayer.longitude}-${interactiveLayer.latitude}`}
        longitude={interactiveLayer.longitude}
        latitude={interactiveLayer.latitude}
        onClose={() => setInteractiveLayer(null)}
        title={getTranslation(layer.layerTitle)}
      >
        <MapPopupItem
          type={layer.type}
          features={layer.features}
          legendItems={layer.legendItems}
        />
      </MapPopup>
    );
  }

  return (
    <MapPopup
      key={`multi-${interactiveLayer.longitude}-${interactiveLayer.latitude}`}
      longitude={interactiveLayer.longitude}
      latitude={interactiveLayer.latitude}
      onClose={() => setInteractiveLayer(null)}
    >
      <MultiLayerCarousel layers={interactiveLayers} />
    </MapPopup>
  );
};

const MultiLayerCarousel: FC<{ layers: InteractiveLayerEntry[] }> = ({
  layers,
}) => {
  const { getTranslation } = useApiTranslation();
  const [api, setApi] = useState<CarouselApi>();
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!api) return;

    const updateHeight = () => {
      const slide = api.slideNodes()[api.selectedScrollSnap()];
      if (slide) setContentHeight(slide.scrollHeight);
    };

    updateHeight();
    api.on("select", updateHeight);
    api.on("reInit", updateHeight);

    return () => {
      api.off("select", updateHeight);
      api.off("reInit", updateHeight);
    };
  }, [api]);

  return (
    <Carousel setApi={setApi}>
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={contentHeight !== null ? { height: contentHeight } : undefined}
      >
        <CarouselContent className="ml-0 items-start">
          {layers.map((layer) => (
            <CarouselItem key={layer.layerId} className="pl-0">
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold leading-6">
                  {getTranslation(layer.layerTitle)}
                </h3>
                <MapPopupItem
                  type={layer.type}
                  features={layer.features}
                  legendItems={layer.legendItems}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
      <div className="flex items-center justify-end gap-1">
        <CarouselPrevious
          variant="ghost"
          size="icon"
          className="static translate-x-0 translate-y-0 size-7 rounded-sm"
        />
        <CarouselNext
          variant="ghost"
          size="icon"
          className="static translate-x-0 translate-y-0 size-7 rounded-sm"
        />
      </div>
    </Carousel>
  );
};

export default MapTooltip;
