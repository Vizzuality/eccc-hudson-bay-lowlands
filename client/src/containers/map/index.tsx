"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapProps, MapRef } from "react-map-gl/mapbox";
import MapBoxMap from "react-map-gl/mapbox";
import {
  type LayersSettings,
  MapStatus,
  useLayerIds,
  useMapBasemap,
  useMapStatus,
  useSyncLayersSettings,
} from "@/app/[locale]/url-store";
import DownloadWatermark from "@/components/download-watermark";
import { AnalysisAreaMask } from "@/containers/map/analysis-area-mask";
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
import { HblAreaMask } from "@/containers/map/hbl-area-mask";
import { LayerManager } from "@/containers/map/layer-manager";
import { useLayerZoomConstraints } from "@/containers/map/layer-manager/use-layer-zoom-constraints";
import MapLegend from "@/containers/map/legend";
import MapLegendItem from "@/containers/map/legend/item";
import MapTooltip from "@/containers/map/tooltip";
import { env } from "@/env";
import useAnalysisSettings, {
  useIsAnalyzing,
} from "@/hooks/use-analysis-settings";
import { cn } from "@/lib/utils";
import { getGeometryBounds } from "@/lib/utils/get-geometry-bounds";

const DEFAULT_CENTER = { longitude: -85.74, latitude: 54.53 };
const DEFAULT_ZOOM = 5;

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
  const [isAnalyzing] = useIsAnalyzing();
  const { mapStatus } = useMapStatus();
  const [{ geometry: analysisGeometry }] = useAnalysisSettings();
  const prevMapStatusRef = useRef(mapStatus);
  const hasZoomedRef = useRef(false);
  const [showHblMask, setShowHblMask] = useState(false);

  const zoomToAnalysisArea = useCallback(() => {
    if (!analysisGeometry || !mapRef.current) return;
    const bounds = getGeometryBounds(analysisGeometry);
    if (!bounds) return;
    hasZoomedRef.current = true;
    mapRef.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 700, right: 100 },
      animate: true,
    });
  }, [analysisGeometry]);

  useEffect(() => {
    const justEnteredAnalysis =
      prevMapStatusRef.current !== MapStatus.analysis &&
      mapStatus === MapStatus.analysis;
    prevMapStatusRef.current = mapStatus;

    if (mapStatus !== MapStatus.analysis) {
      hasZoomedRef.current = false;
      return;
    }

    if (hasZoomedRef.current) return;

    // Map loaded while already in analysis mode (shared analysis page)
    if (!justEnteredAnalysis && loaded) {
      zoomToAnalysisArea();
      return;
    }

    if (!justEnteredAnalysis) return;

    // Entered analysis from upload — sidebar expands instantly, wait for resize
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        zoomToAnalysisArea();
      });
    });
  }, [mapStatus, loaded, zoomToAnalysisArea]);

  useEffect(() => {
    if (mapStatus !== MapStatus.upload) {
      setShowHblMask(false);
      return;
    }

    const sidebar = document.querySelector("aside");
    if (!sidebar) {
      setShowHblMask(true);
      return;
    }

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === sidebar && e.propertyName === "opacity") {
        sidebar.removeEventListener("transitionend", onTransitionEnd);
        setShowHblMask(true);
      }
    };
    sidebar.addEventListener("transitionend", onTransitionEnd);

    const fallback = setTimeout(() => {
      sidebar.removeEventListener("transitionend", onTransitionEnd);
      setShowHblMask(true);
    }, 500);

    return () => {
      clearTimeout(fallback);
      sidebar.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [mapStatus]);

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
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full flex-1 overflow-hidden rounded-tl-3xl border border-white bg-white",
        className,
      )}
    >
      <div className="absolute inset-px overflow-hidden rounded-tl-3xl">
        <DownloadWatermark />
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 cursor-not-allowed" />
        )}
        <MapBoxMap
          ref={mapRef}
          mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          projection="mercator"
          initialViewState={{
            ...DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
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
              {showHblMask && <HblAreaMask />}
              {mapStatus === MapStatus.analysis && <AnalysisAreaMask />}
              <MapTooltip />
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
                className={
                  index === 0 ? "border-t-0 pt-4 pb-6" : "border-t py-6"
                }
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
    </div>
  );
};

export default MapContainer;
