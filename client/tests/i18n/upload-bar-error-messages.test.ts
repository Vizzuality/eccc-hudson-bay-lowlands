import { describe, expect, it } from "vitest";
import type { UploadBarError } from "@/containers/map/analyze-button/upload-bar/types";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";

const UPLOAD_BAR_ERRORS: Record<UploadBarError, true> = {
  "area-too-big": true,
  "area-too-small": true,
  "outside-of-bounds": true,
  "invalid-geometry": true,
  "generic-error": true,
  "upload-error-invalid-json": true,
  "upload-error-invalid-geojson": true,
  "upload-error-unsupported-file": true,
  "upload-error-invalid-zip": true,
  "upload-error-shp-missing-file": true,
  "upload-error-unsupported-crs": true,
};

const errorKeys = Object.keys(UPLOAD_BAR_ERRORS) as UploadBarError[];

describe.each([
  ["en", en],
  ["fr", fr],
])("%s messages", (_locale, messages) => {
  it.each(errorKeys)("has a non-empty message for %s", (key) => {
    const message = (messages.analysis as Record<string, unknown>)[key];
    expect(typeof message).toBe("string");
    expect(message).not.toBe("");
  });
});
