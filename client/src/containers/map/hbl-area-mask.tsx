import { Layer, Source } from "react-map-gl/mapbox";

import { useHblArea } from "@/hooks/use-hbl-area";

const SOURCE_ID = "hbl-area-mask";
const LAYER_ID = "hbl-area-mask-fill";

export function HblAreaMask() {
  const { data: invertedFeature } = useHblArea();

  if (!invertedFeature) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={invertedFeature}>
      <Layer
        id={LAYER_ID}
        type="fill"
        paint={{
          "fill-color": "#000",
          "fill-opacity": 0.35,
        }}
      />
    </Source>
  );
}
