import type { LngLatBoundsLike } from "react-map-gl/mapbox";

import type { ParsedGeoJSON } from "@/lib/utils/geometry-upload";

export function getGeometryBounds(
  geojson: ParsedGeoJSON,
): LngLatBoundsLike | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const features =
    geojson.type === "FeatureCollection" ? geojson.features : [geojson];

  for (const feature of features) {
    const { geometry } = feature;
    const rings =
      geometry.type === "Polygon"
        ? geometry.coordinates
        : geometry.coordinates.flat();

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  if (!Number.isFinite(minLng)) return null;

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
