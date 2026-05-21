import { Layer, Source } from "react-map-gl/mapbox";

import useAnalysisSettings from "@/hooks/use-analysis-settings";
import type { ParsedGeoJSON } from "@/lib/utils/geometry-upload";
import { invertPolygon } from "@/lib/utils/invert-polygon";

const SOURCE_ID = "analysis-area-mask";
const LAYER_ID = "analysis-area-mask-fill";

function getFirstFeature(geojson: ParsedGeoJSON) {
  if (geojson.type === "FeatureCollection") {
    return geojson.features[0] ?? null;
  }
  return geojson;
}

export function AnalysisAreaMask() {
  const [{ geometry }] = useAnalysisSettings();

  if (!geometry) return null;

  const feature = getFirstFeature(geometry);
  if (!feature) return null;

  const invertedFeature = invertPolygon(feature);

  return (
    <Source id={SOURCE_ID} type="geojson" data={invertedFeature}>
      <Layer
        id={LAYER_ID}
        type="fill"
        paint={{
          "fill-color": "#000",
          "fill-opacity": 0.3,
        }}
      />
    </Source>
  );
}
