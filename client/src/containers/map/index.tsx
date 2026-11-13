"use client";

import type { PaddingOptions } from "mapbox-gl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { MapProps, MapRef } from "react-map-gl/mapbox";
import MapBoxMap from "react-map-gl/mapbox";
import { useMediaQuery } from "usehooks-ts";
import {
  type LayersSettings,
  MapStatus,
  useIsMobileDataViewOpen,
  useIsMobileResultsViewOpen,
  useLayerIds,
  useMapAnalysis,
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
  DESKTOP_FIT_PADDING,
  HUDSON_BAY_MAX_BOUNDS,
  MOBILE_FIT_PADDING,
} from "@/containers/map/constants";
import { Controls } from "@/containers/map/controls";
import MapDownload from "@/containers/map/controls/download";
import HelpControl from "@/containers/map/controls/help";
import LegendControl from "@/containers/map/controls/legend";
import SettingsControl from "@/containers/map/controls/settings";
import { BasemapControl } from "@/containers/map/controls/settings/basemap";
import ZoomControl from "@/containers/map/controls/zoom";
import { HblAreaMask } from "@/containers/map/hbl-area-mask";
import { LayerManager } from "@/containers/map/layer-manager";
import { useAboveMaskLayerIds } from "@/containers/map/layer-manager/hooks";
import { useLayerZoomConstraints } from "@/containers/map/layer-manager/use-layer-zoom-constraints";
import { pinAboveMaskLayers } from "@/containers/map/layer-manager/utils";
import MapLegend from "@/containers/map/legend";
import MapLegendItem from "@/containers/map/legend/item";
import MobileAnalysis from "@/containers/map/mobile-analysis";
import MapTooltip from "@/containers/map/tooltip";
import {
  easeOutCubic,
  MAP_INSET_DURATION_MS,
  MAP_INSET_TRANSITION,
} from "@/containers/map-layout/constants";
import { env } from "@/env";
import useAnalysisSettings, {
  useIsAnalyzing,
} from "@/hooks/use-analysis-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { getGeometryBounds } from "@/lib/utils/get-geometry-bounds";

const DEFAULT_CENTER = { longitude: -85.74, latitude: 54.53 };
const DEFAULT_ZOOM = 5;

type Padding = Required<PaddingOptions>;

function insetPadding(left: number): Padding {
  return { left, top: 0, right: 0, bottom: 0 };
}

function setPaddingInPlace(map: MapRef, padding: Padding) {
  const { width, height } = map.getContainer().getBoundingClientRect();
  const x = padding.left + (width - padding.left - padding.right) / 2;
  const y = padding.top + (height - padding.top - padding.bottom) / 2;
  map.jumpTo({ center: map.unproject([x, y]), padding });
}

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
  const aboveMaskIds = useAboveMaskLayerIds();
  const { layersSettings, setLayersSettings } = useSyncLayersSettings();
  const { maxZoom } = useLayerZoomConstraints();
  const [isAnalyzing] = useIsAnalyzing();
  const { mapStatus } = useMapStatus();
  const [{ geometry: analysisGeometry }] = useAnalysisSettings();
  const { datasets } = useMapAnalysis();
  const prevMapStatusRef = useRef<MapStatus | null>(null);
  const [initialInset, setInitialInset] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isSidebarOpen = mapStatus !== MapStatus.upload;
  const isMobileDataViewOpen = useIsMobileDataViewOpen();
  const isMobileResultsViewOpen = useIsMobileResultsViewOpen();

  const getInset = useCallback(() => {
    const el = containerRef.current;
    if (!el || isMobile || !isSidebarOpen) return 0;
    const style = getComputedStyle(el);
    const sidebar = Number.parseFloat(
      style.getPropertyValue("--sidebar-width"),
    );
    const panel = datasets
      ? Number.parseFloat(style.getPropertyValue("--datasets-panel-width"))
      : 0;
    return (sidebar || 0) + (panel || 0);
  }, [isMobile, isSidebarOpen, datasets]);

  useLayoutEffect(() => {
    setInitialInset((current) => current ?? getInset());
  }, [getInset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;

    const prevStatus = prevMapStatusRef.current;
    prevMapStatusRef.current = mapStatus;
    const inset = getInset();
    const duration = reducedMotion ? 0 : MAP_INSET_DURATION_MS;

    if (mapStatus === MapStatus.analysis && prevStatus !== MapStatus.analysis) {
      const bounds = analysisGeometry && getGeometryBounds(analysisGeometry);
      if (!bounds) return;
      map.fitBounds(bounds, {
        padding: isMobile
          ? MOBILE_FIT_PADDING
          : { ...DESKTOP_FIT_PADDING, left: DESKTOP_FIT_PADDING.left + inset },
        linear: true,
        duration,
        easing: easeOutCubic,
      });
      return;
    }

    if (prevStatus === MapStatus.analysis && mapStatus !== MapStatus.analysis) {
      map.easeTo({
        center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
        zoom: DEFAULT_ZOOM,
        padding: insetPadding(inset),
        duration,
        easing: easeOutCubic,
      });
      return;
    }

    if (prevStatus === null) {
      map.jumpTo({ padding: insetPadding(inset) });
      return;
    }

    setPaddingInPlace(map, insetPadding(inset));
  }, [loaded, mapStatus, getInset, reducedMotion, analysisGeometry, isMobile]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    const onResize = () => {
      if (map.isMoving()) return;
      setPaddingInPlace(map, insetPadding(getInset()));
    };
    map.on("resize", onResize);
    return () => {
      map.off("resize", onResize);
    };
  }, [loaded, getInset]);

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
      inert={isMobile && (isMobileDataViewOpen || isMobileResultsViewOpen)}
      data-sidebar={isSidebarOpen ? "open" : "closed"}
      data-datasets={datasets ? "open" : "closed"}
      className={cn(
        "relative isolate h-full w-full flex-1 overflow-hidden bg-white lg:absolute lg:inset-0",
        "[--map-inset:0px] lg:data-[sidebar=open]:[--map-inset:var(--sidebar-width)] lg:data-[sidebar=open]:data-[datasets=open]:[--map-inset:calc(var(--sidebar-width)+var(--datasets-panel-width))]",
        "lg:[clip-path:inset(0_0_0_var(--map-inset)_round_24px_0_0_0)] lg:transition-[clip-path]",
        MAP_INSET_TRANSITION,
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden lg:inset-px lg:[clip-path:inset(0_0_0_var(--map-inset)_round_23px_0_0_0)] lg:transition-[clip-path]",
          MAP_INSET_TRANSITION,
        )}
      >
        {isAnalyzing && (
          <div className="absolute inset-0 z-10 cursor-not-allowed" />
        )}
        {initialInset !== null && (
          <MapBoxMap
            ref={mapRef}
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
            style={{ width: "100%", height: "100%" }}
            mapStyle={mapStyle}
            projection="mercator"
            initialViewState={{
              ...DEFAULT_CENTER,
              zoom: DEFAULT_ZOOM,
              padding: insetPadding(initialInset),
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
            {loaded && (
              <>
                <LayerManager />
                <HblAreaMask visible={mapStatus === MapStatus.upload} />
                <AnalysisAreaMask visible={mapStatus === MapStatus.analysis} />
                <MapTooltip />
                {children}
              </>
            )}
            <div
              data-map-overlay
              className={cn(
                "pointer-events-none absolute inset-y-0 right-0 left-(--map-inset) transition-[left] *:pointer-events-auto",
                MAP_INSET_TRANSITION,
              )}
            >
              <DownloadWatermark />
              {isMobile ? <MobileAnalysis /> : <AnalyzeButton />}
              <Controls
                className="absolute top-6 right-6 max-lg:right-4"
                data-tour="map-controls"
              >
                <ZoomControl />
                <SettingsControl>
                  <BasemapControl />
                </SettingsControl>
                <LegendControl />
                <MapDownload
                  containerRef={containerRef}
                  className="max-lg:hidden"
                />
                <HelpControl />
              </Controls>
              <MapLegend
                sortable={{ enabled: true, handle: true }}
                onChangeOrder={(v) => {
                  setLayerIds(pinAboveMaskLayers(v, aboveMaskIds).toReversed());
                }}
              >
                {pinAboveMaskLayers(layerIds.toReversed(), aboveMaskIds).map(
                  (id, index) => (
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
                        setLayerIds(
                          layerIds.filter((layerId) => layerId !== id),
                        );
                      }}
                    />
                  ),
                )}
              </MapLegend>
            </div>
          </MapBoxMap>
        )}
      </div>
    </div>
  );
};

export default MapContainer;
