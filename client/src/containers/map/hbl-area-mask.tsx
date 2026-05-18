import { LoaderCircle } from "lucide-react";
import { Layer, Source } from "react-map-gl/mapbox";

import { useHblArea } from "@/hooks/use-hbl-area";

const SOURCE_ID = "hbl-area-mask";
const LAYER_ID = "hbl-area-mask-fill";

export function HblAreaMask() {
  const { data: invertedFeature, isLoading } = useHblArea();

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-10 flex cursor-not-allowed items-center justify-center bg-black/60">
        <LoaderCircle
          className="size-8 animate-spin text-white"
          aria-label="Loading study area"
        />
      </div>
    );
  }

  if (!invertedFeature) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={invertedFeature}>
      <Layer
        id={LAYER_ID}
        type="fill"
        paint={{
          "fill-color": "#000",
          "fill-opacity": 0.6,
        }}
      />
    </Source>
  );
}
