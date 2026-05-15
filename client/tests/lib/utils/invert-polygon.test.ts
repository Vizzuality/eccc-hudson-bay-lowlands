import type { Feature, MultiPolygon, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { invertPolygon } from "@/lib/utils/invert-polygon";

const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

const ccwSquare = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
];

const cwSquare = [...ccwSquare].reverse();

function makeFeature(
  geometry: Polygon | MultiPolygon,
): Feature<Polygon | MultiPolygon> {
  return { type: "Feature", properties: {}, geometry };
}

describe("invertPolygon", () => {
  it("returns a Polygon with the world ring as the outer and the input as a hole", () => {
    const result = invertPolygon(
      makeFeature({ type: "Polygon", coordinates: [cwSquare] }),
    );

    expect(result.type).toBe("Feature");
    expect(result.geometry.type).toBe("Polygon");
    expect(result.geometry.coordinates).toHaveLength(2);
    expect(result.geometry.coordinates[0]).toEqual(WORLD_RING);
  });

  it("enforces clockwise winding on the hole", () => {
    const result = invertPolygon(
      makeFeature({ type: "Polygon", coordinates: [ccwSquare] }),
    );

    const hole = result.geometry.coordinates[1];
    expect(hole).toEqual(cwSquare);
  });

  it("preserves already-clockwise holes unchanged", () => {
    const result = invertPolygon(
      makeFeature({ type: "Polygon", coordinates: [cwSquare] }),
    );

    const hole = result.geometry.coordinates[1];
    expect(hole).toEqual(cwSquare);
  });

  it("handles MultiPolygon by treating each outer ring as a separate hole", () => {
    const shifted = cwSquare.map(([x, y]) => [x + 5, y + 5]);
    const result = invertPolygon(
      makeFeature({
        type: "MultiPolygon",
        coordinates: [[cwSquare], [shifted]],
      }),
    );

    expect(result.geometry.coordinates).toHaveLength(3);
    expect(result.geometry.coordinates[0]).toEqual(WORLD_RING);
  });

  it("returns plain arrays (no non-enumerable properties)", () => {
    const result = invertPolygon(
      makeFeature({ type: "Polygon", coordinates: [cwSquare] }),
    );

    const coord = result.geometry.coordinates[1][0];
    expect(Array.isArray(coord)).toBe(true);
    expect(Object.getOwnPropertyNames(coord)).toEqual(["0", "1", "length"]);
  });
});
