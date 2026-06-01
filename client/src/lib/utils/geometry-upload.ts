import { load } from "@loaders.gl/core";
import { ShapefileLoader } from "@loaders.gl/shapefile";
import { ZipLoader } from "@loaders.gl/zip";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";

export type ValidGeometryType = Polygon | MultiPolygon;

export enum UploadErrorType {
  Generic = "generic-error",
  UnsupportedFile = "unsupported-file",
  InvalidJSON = "invalid-json",
  InvalidGeoJSON = "invalid-geojson",
  InvalidZip = "invalid-zip",
  SHPMissingFile = "shp-missing-file",
  UnsupportedCRS = "unsupported-crs",
}

export type ParsedGeoJSON =
  | Feature<ValidGeometryType>
  | FeatureCollection<ValidGeometryType>;

const REQUIRED_SHP_EXTENSIONS = [".shp", ".shx", ".dbf"];

function isFeature(value: unknown): value is Feature {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).type === "Feature" &&
    (value as Record<string, unknown>).geometry !== undefined
  );
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).type === "FeatureCollection" &&
    Array.isArray((value as Record<string, unknown>).features)
  );
}

function hasPolygonGeometry(
  feature: Feature,
): feature is Feature<ValidGeometryType> {
  return (
    feature.geometry?.type === "Polygon" ||
    feature.geometry?.type === "MultiPolygon"
  );
}

function filterPolygonFeatures(
  features: Feature[],
): Feature<ValidGeometryType>[] {
  return features.filter(hasPolygonGeometry);
}

// Accepted spellings of WGS84 / CRS84 in a legacy GeoJSON-2008 `crs` member.
// RFC 7946 GeoJSON omits `crs` entirely and is always WGS84, so an absent
// member is also accepted (see assertSupportedCRS).
const ACCEPTED_CRS_NAMES = new Set([
  "urn:ogc:def:crs:ogc:1.3:crs84",
  "urn:ogc:def:crs:ogc::crs84",
  "urn:ogc:def:crs:epsg::4326",
  "http://www.opengis.net/def/crs/ogc/1.3/crs84",
  "http://www.opengis.net/def/crs/epsg/0/4326",
  "epsg:4326",
  "crs84",
  "crs:84",
]);

// Fail closed: a `crs` member we can't confidently identify as 4326/CRS84 is
// treated as unsupported. The range check is the backstop for files that
// declare no CRS but still carry non-4326 coordinates.
function assertSupportedCRS(value: object): void {
  const crs = (value as { crs?: unknown }).crs;
  if (crs == null) return;

  const name = (crs as { properties?: { name?: unknown } }).properties?.name;
  if (
    typeof name === "string" &&
    ACCEPTED_CRS_NAMES.has(name.trim().toLowerCase())
  ) {
    return;
  }

  throw UploadErrorType.UnsupportedCRS;
}

function assertCoordinatesInRange(geometry: ValidGeometryType): void {
  const rings =
    geometry.type === "Polygon"
      ? geometry.coordinates
      : geometry.coordinates.flat();

  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw UploadErrorType.UnsupportedCRS;
      }
    }
  }
}

function extractGeoJSON(parsed: unknown): ParsedGeoJSON {
  if (isFeature(parsed)) {
    if (!hasPolygonGeometry(parsed)) {
      throw UploadErrorType.InvalidGeoJSON;
    }
    assertSupportedCRS(parsed);
    assertCoordinatesInRange(parsed.geometry);
    return parsed;
  }

  if (isFeatureCollection(parsed)) {
    const polygonFeatures = filterPolygonFeatures(parsed.features);
    if (polygonFeatures.length === 0) {
      throw UploadErrorType.InvalidGeoJSON;
    }
    assertSupportedCRS(parsed);
    for (const feature of polygonFeatures) {
      assertCoordinatesInRange(feature.geometry);
    }
    return { ...parsed, features: polygonFeatures };
  }

  throw UploadErrorType.InvalidGeoJSON;
}

async function parseGeoJSONFile(file: File): Promise<ParsedGeoJSON> {
  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    throw UploadErrorType.InvalidJSON;
  }

  return extractGeoJSON(parsed);
}

async function parseShapefileZip(file: File): Promise<ParsedGeoJSON> {
  let fileMap: Record<string, ArrayBuffer>;
  try {
    fileMap = (await load(file, ZipLoader)) as Record<string, ArrayBuffer>;
  } catch {
    throw UploadErrorType.InvalidZip;
  }

  const fileNames = Object.keys(fileMap);
  const lowerNames = fileNames.map((n) => n.toLowerCase());

  const missingExtensions = REQUIRED_SHP_EXTENSIONS.filter(
    (ext) => !lowerNames.some((name) => name.endsWith(ext)),
  );

  if (missingExtensions.length > 0) {
    throw UploadErrorType.SHPMissingFile;
  }

  const shpFileName = fileNames.find((n) => n.toLowerCase().endsWith(".shp"));
  if (!shpFileName) {
    throw UploadErrorType.SHPMissingFile;
  }

  let content: Awaited<ReturnType<typeof ShapefileLoader.parse>>;
  try {
    content = (await load(
      new File([fileMap[shpFileName]], shpFileName),
      ShapefileLoader,
      {
        gis: { format: "geojson", reproject: true },
        shp: { _maxDimensions: 2 },
        fetch: async (url: string | File): Promise<Response> => {
          if (url instanceof File) {
            return new Response(url);
          }

          const extension = url.split(".").pop()?.toLowerCase() ?? "";
          const match = fileNames.find((n) =>
            n.toLowerCase().endsWith(`.${extension}`),
          );

          if (match && fileMap[match]) {
            return new Response(fileMap[match]);
          }

          return new Response(null, { status: 404 });
        },
      },
    )) as Awaited<ReturnType<typeof ShapefileLoader.parse>>;
  } catch {
    throw UploadErrorType.InvalidGeoJSON;
  }

  const featureCollection = content.data[0];
  return extractGeoJSON(featureCollection);
}

export async function parseGeometryFile(file: File): Promise<ParsedGeoJSON> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "geojson" || extension === "json") {
    return parseGeoJSONFile(file);
  }

  if (extension === "zip") {
    return parseShapefileZip(file);
  }

  throw UploadErrorType.UnsupportedFile;
}
