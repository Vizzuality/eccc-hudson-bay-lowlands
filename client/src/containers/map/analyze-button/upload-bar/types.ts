import { UploadErrorType } from "@/lib/utils/geometry-upload";

export type UploadBarError =
  | "area-too-big"
  | "outside-of-bounds"
  | "invalid-geometry"
  | "generic-error"
  | "upload-error-invalid-json"
  | "upload-error-invalid-geojson"
  | "upload-error-unsupported-file"
  | "upload-error-invalid-zip"
  | "upload-error-shp-missing-file"
  | "upload-error-unsupported-crs";

export function mapUploadError(error: UploadErrorType): UploadBarError {
  switch (error) {
    case UploadErrorType.InvalidJSON:
      return "upload-error-invalid-json";
    case UploadErrorType.InvalidGeoJSON:
      return "upload-error-invalid-geojson";
    case UploadErrorType.UnsupportedFile:
      return "upload-error-unsupported-file";
    case UploadErrorType.InvalidZip:
      return "upload-error-invalid-zip";
    case UploadErrorType.SHPMissingFile:
      return "upload-error-shp-missing-file";
    case UploadErrorType.UnsupportedCRS:
      return "upload-error-unsupported-crs";
    default:
      return "generic-error";
  }
}
