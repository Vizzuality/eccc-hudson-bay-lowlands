import { describe, expect, it } from "vitest";
import {
  parseGeometryFile,
  UploadErrorType,
} from "@/lib/utils/geometry-upload";

function geojsonFile(value: unknown, name = "area.geojson"): File {
  return new File([JSON.stringify(value)], name, {
    type: "application/geo+json",
  });
}

// A small polygon inside the Hudson Bay Lowlands (valid WGS84 degrees).
const hblPolygon = {
  type: "Polygon" as const,
  coordinates: [
    [
      [-84.5, 55.5],
      [-83.5, 55.5],
      [-83.5, 56.5],
      [-84.5, 56.5],
      [-84.5, 55.5],
    ],
  ],
};

const validFeature = {
  type: "Feature" as const,
  properties: {},
  geometry: hblPolygon,
};

describe("parseGeometryFile CRS detection", () => {
  it("rejects projected coordinates outside the WGS84 range", async () => {
    const projected = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [500000, 6000000],
            [501000, 6000000],
            [501000, 6001000],
            [500000, 6001000],
            [500000, 6000000],
          ],
        ],
      },
    };

    await expect(parseGeometryFile(geojsonFile(projected))).rejects.toBe(
      UploadErrorType.UnsupportedCRS,
    );
  });

  it("rejects a non-4326 crs member even when coordinates are in range", async () => {
    const declaredMercator = {
      ...validFeature,
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::3857" } },
    };

    await expect(parseGeometryFile(geojsonFile(declaredMercator))).rejects.toBe(
      UploadErrorType.UnsupportedCRS,
    );
  });

  it("accepts a valid 4326 polygon with no crs member", async () => {
    const result = await parseGeometryFile(geojsonFile(validFeature));

    expect(result.type).toBe("Feature");
  });

  it("accepts an explicit CRS84 crs member", async () => {
    const withCrs84 = {
      ...validFeature,
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
      },
    };

    const result = await parseGeometryFile(geojsonFile(withCrs84));

    expect(result.type).toBe("Feature");
  });

  it("accepts an explicit EPSG:4326 crs member", async () => {
    const withEpsg4326 = {
      ...validFeature,
      crs: { type: "name", properties: { name: "EPSG:4326" } },
    };

    const result = await parseGeometryFile(geojsonFile(withEpsg4326));

    expect(result.type).toBe("Feature");
  });
});
