"use client";

import { useState } from "react";
import type { MapProps } from "react-map-gl/mapbox";
import MapBoxMap from "react-map-gl/mapbox";
import AnalyzeButton from "@/containers/map/analyze-button";
import { Controls } from "@/containers/map/controls";
import SearchControl from "@/containers/map/controls/search";
import SettingsControl from "@/containers/map/controls/settings";
import ZoomControl from "@/containers/map/controls/zoom";
import MapLegend from "@/containers/map/legend";
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
  const [loaded, setLoaded] = useState<boolean>(false);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapBoxMap
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
        mapStyle="mapbox://styles/ecc-design/cmk2eevpe00k801s91cva9417"
        projection="mercator"
        initialViewState={{
          longitude: defaultLongitude,
          latitude: defaultLatitude,
          zoom: defaultZoom,
        }}
        onLoad={() => setLoaded(true)}
        testMode={!!process.env.NEXT_PUBLIC_E2E}
        {...props}
      >
        <AnalyzeButton />
        {loaded && children}
        <Controls>
          <SearchControl />
          <ZoomControl />
          <SettingsControl>
            <div>Settings</div>
          </SettingsControl>
        </Controls>
        <MapLegend />
      </MapBoxMap>
    </div>
  );
};

export default MapContainer;
