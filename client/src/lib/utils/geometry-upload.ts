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
}

export type ParsedGeoJSON =
  | Feature<ValidGeometryType>
  | FeatureCollection<ValidGeometryType>;

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

export async function parseGeoJSONFile(file: File): Promise<ParsedGeoJSON> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "geojson" && extension !== "json") {
    return Promise.reject(UploadErrorType.UnsupportedFile);
  }

  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    return Promise.reject(UploadErrorType.InvalidJSON);
  }

  if (isFeature(parsed)) {
    if (!hasPolygonGeometry(parsed)) {
      return Promise.reject(UploadErrorType.InvalidGeoJSON);
    }
    return parsed;
  }

  if (isFeatureCollection(parsed)) {
    const polygonFeatures = filterPolygonFeatures(parsed.features);
    if (polygonFeatures.length === 0) {
      return Promise.reject(UploadErrorType.InvalidGeoJSON);
    }
    return { ...parsed, features: polygonFeatures };
  }

  return Promise.reject(UploadErrorType.InvalidGeoJSON);
}
