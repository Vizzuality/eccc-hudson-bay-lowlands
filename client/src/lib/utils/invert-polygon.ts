import type { Feature, MultiPolygon, Polygon, Position } from "geojson";

const WORLD_RING: Position[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

function isClockwise(ring: Position[]): boolean {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum > 0;
}

export function invertPolygon(
  feature: Feature<Polygon | MultiPolygon>,
): Feature<Polygon> {
  const { geometry } = feature;

  const outerRings: Position[][] =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((poly) => poly[0]);

  const holes = outerRings.map((ring) =>
    isClockwise(ring) ? ring : [...ring].reverse(),
  );

  const result: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [WORLD_RING, ...holes],
    },
  };

  // Deep clone to produce plain arrays — Mapbox GL's fill tessellation
  // fails on coordinate arrays that carry non-enumerable properties
  // from upstream processing (e.g. react-query structural sharing).
  return JSON.parse(JSON.stringify(result));
}
