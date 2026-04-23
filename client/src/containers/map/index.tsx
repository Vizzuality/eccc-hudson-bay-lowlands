"use client";

import { useEffect, useRef, useState } from "react";
import type { MapProps, MapRef } from "react-map-gl/mapbox";
import MapBoxMap from "react-map-gl/mapbox";
import {
  type LayersSettings,
  useLayerIds,
  useMapBasemap,
  useSyncLayersSettings,
} from "@/app/[locale]/url-store";
import AnalyzeButton from "@/containers/map/analyze-button";
import {
  BASEMAPS,
  type BasemapId,
  DEFAULT_MIN_ZOOM,
  HUDSON_BAY_MAX_BOUNDS,
} from "@/containers/map/constants";
import { Controls } from "@/containers/map/controls";
import MapDownload from "@/containers/map/controls/download";
import SettingsControl from "@/containers/map/controls/settings";
import { BasemapControl } from "@/containers/map/controls/settings/basemap";
import ZoomControl from "@/containers/map/controls/zoom";
import { LayerManager } from "@/containers/map/layer-manager";
import { useLayerZoomConstraints } from "@/containers/map/layer-manager/use-layer-zoom-constraints";
import MapLegend from "@/containers/map/legend";
import MapLegendItem from "@/containers/map/legend/item";
import { env } from "@/env";
import { cn } from "@/lib/utils";

const defaultBbox = [-112, 50, -56, 64];
const defaultZoom = 5;
// Calculate center from bbox: [minLng, minLat, maxLng, maxLat]
const defaultLongitude = (defaultBbox[0] + defaultBbox[2]) / 2;
const defaultLatitude = (defaultBbox[1] + defaultBbox[3]) / 2;

type MapContainerProps = {
  className?: HTMLDivElement["className"];
} & MapProps;

const MapContainer = ({ className, children, ...props }: MapContainerProps) => {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const { basemap } = useMapBasemap();
  const mapStyle = BASEMAPS[basemap as BasemapId].mapStyle;
  const { layerIds, setLayerIds } = useLayerIds();
  const { layersSettings, setLayersSettings } = useSyncLayersSettings();
  const { maxZoom } = useLayerZoomConstraints();

  // Enforce zoom constraints imperatively to avoid triggering _createProxyTransform
  // in @vis.gl/react-mapbox. Passing minZoom/maxZoom as props causes it to re-wrap
  // map.transform in a new Proxy on every change. _calcMatrices is in unproxiedMethods
  // so it calls both transforms in each proxy layer — exponential recursion → stack overflow.
  useEffect(() => {
    if (!loaded) return;
    mapRef.current?.getMap().setMaxZoom(maxZoom);
  }, [loaded, maxZoom]);

  useEffect(() => {
    if (!layerIds?.length && !layersSettings) return;

    if (!layerIds?.length && layersSettings) {
      setTimeout(() => {
        setLayersSettings(null);
      }, 0);
      return;
    }

    const lSettingsKeys = Object.keys(layersSettings || {});

    lSettingsKeys.forEach((key) => {
      if (layerIds.includes(key)) return;

      setTimeout(() => {
        setLayersSettings((prev) => {
          const current = { ...prev } as LayersSettings<unknown>;
          delete current[key];
          return current;
        });
      }, 0);
    });
  }, [layerIds, layersSettings, setLayersSettings]);

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      <MapBoxMap
        ref={mapRef}
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
        mapStyle={mapStyle}
        projection="mercator"
        initialViewState={{
          longitude: defaultLongitude,
          latitude: defaultLatitude,
          zoom: defaultZoom,
        }}
        onLoad={() => {
          const map = mapRef.current?.getMap();
          // All constraints set imperatively — never as props — to prevent
          // @vis.gl/react-mapbox from calling _createProxyTransform on each change,
          // which stacks proxy layers causing exponential _calcMatrices recursion.
          map?.setMaxBounds(HUDSON_BAY_MAX_BOUNDS);
          map?.setMinZoom(DEFAULT_MIN_ZOOM);
          setLoaded(true);
        }}
        preserveDrawingBuffer
        testMode={
          !!process.env.NEXT_PUBLIC_E2E || process.env.NODE_ENV === "test"
        }
        {...props}
      >
        <AnalyzeButton />
        {loaded && (
          <>
            <LayerManager />
            {children}
          </>
        )}
        <Controls>
          <ZoomControl />
          <SettingsControl>
            <BasemapControl />
          </SettingsControl>
          <MapDownload containerRef={containerRef} />
        </Controls>
        <MapLegend
          sortable={{ enabled: true, handle: true }}
          onChangeOrder={(v) => {
            setLayerIds(v.toReversed());
          }}
        >
          {layerIds.toReversed().map((id, index) => (
            <MapLegendItem
              key={`map-legend-item-${id}`}
              id={id.toString()}
              className={index === 0 ? "border-t-0 pt-4 pb-6" : "border-t py-6"}
              sortable={{ enabled: true, handle: true }}
              settingsManager={{
                visibility: true,
                remove: true,
              }}
              settings={layersSettings?.[id.toString()] || {}}
              onChangeVisibility={(v) => {
                setLayersSettings({
                  ...layersSettings,
                  [id]: { visibility: v },
                });
              }}
              onRemove={(id) => {
                setLayerIds(layerIds.filter((layerId) => layerId !== id));
              }}
            />
          ))}
        </MapLegend>
      </MapBoxMap>
    </div>
  );
};

export default MapContainer;
