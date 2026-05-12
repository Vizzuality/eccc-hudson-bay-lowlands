import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { Feature } from "geojson";
import {
  CheckIcon,
  CircleAlertIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import QuestionMarkIcon from "@/components/icons/question-mark";
import TileIcon from "@/components/icons/tile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import RichText from "@/components/ui/rich-text";
import useAnalysisSettings, {
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";
import useMapDraw from "@/hooks/use-map-draw";
import { API } from "@/lib/api";
import { postAnalysisConfig } from "@/lib/api/config";
import {
  type ParsedGeoJSON,
  parseGeoJSONFile,
  UploadErrorType,
  type ValidGeometryType,
} from "@/lib/utils/geometry-upload";
import type { AnalysisResponse } from "@/types";

type UploadBarError =
  | "area-too-big"
  | "outside-of-bounds"
  | "generic-error"
  | "upload-error-invalid-json"
  | "upload-error-invalid-geojson"
  | "upload-error-unsupported-file";

function mapUploadError(error: UploadErrorType): UploadBarError {
  switch (error) {
    case UploadErrorType.InvalidJSON:
      return "upload-error-invalid-json";
    case UploadErrorType.InvalidGeoJSON:
      return "upload-error-invalid-geojson";
    case UploadErrorType.UnsupportedFile:
      return "upload-error-unsupported-file";
    default:
      return "generic-error";
  }
}

const UploadBar = () => {
  const { mapStatus, setMapStatus } = useMapStatus();
  const [isDrawing, setIsDrawing] = useState(false);
  const t = useTranslations("analysis");

  const [error, setError] = useState<UploadBarError | null>(null);
  const [{ geometry, locationType, fileName }, setAnalysisSettings] =
    useAnalysisSettings();
  const setAnalysisResult = useSetAnalysisResult();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: postAnalysis, isPending } = useMutation({
    mutationFn: (geometry: GeoJSON.Feature | GeoJSON.FeatureCollection) =>
      API<AnalysisResponse>(postAnalysisConfig(geometry)),
    onSuccess: (data) => {
      setIsDrawing(false);
      setAnalysisResult(data);
      setMapStatus(MapStatus.analysis);
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 422) {
        const detail: unknown = err.response.data?.detail;
        if (typeof detail === "string") {
          if (
            detail.includes("exceeds the maximum") ||
            detail.includes("below the minimum")
          ) {
            setError("area-too-big");
          } else if (detail.includes("does not intersect")) {
            setError("outside-of-bounds");
          } else {
            setError("generic-error");
          }
          return;
        }
      }
      setError("generic-error");
    },
  });

  const onUpdateGeometry = useCallback(
    ({ features }: { features: Feature[] }) => {
      const geometry = (features[0] as ParsedGeoJSON) ?? null;

      setError(null);

      setAnalysisSettings((settings) => ({
        ...settings,
        locationType: "draw" as const,
        geometry,
        fileName: null,
      }));
    },
    [setAnalysisSettings],
  );

  const { redraw } = useMapDraw({
    enabled: mapStatus === MapStatus.upload && locationType === "draw",
    styleVariant: mapStatus === MapStatus.analysis ? "analysis" : "draw",
    geometry:
      geometry && geometry.type === "Feature"
        ? (geometry as GeoJSON.Feature<ValidGeometryType>)
        : undefined,
    onCreate: onUpdateGeometry,
    onUpdate: onUpdateGeometry,
    onDrawingStart: () => setIsDrawing(true),
  });

  const resetState = useCallback(() => {
    redraw();
    setError(null);
    setAnalysisSettings((settings) => ({
      ...settings,
      locationType: "draw",
      geometry: null,
      fileName: null,
    }));
  }, [setAnalysisSettings, redraw]);

  useEffect(() => {
    if (mapStatus === MapStatus.default) {
      resetState();
      if (isDrawing) {
        setIsDrawing(false);
      }
    }
  }, [mapStatus, isDrawing, resetState]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset file input so the same file can be re-selected
      e.target.value = "";

      setError(null);

      try {
        const parsed = await parseGeoJSONFile(file);

        setAnalysisSettings((settings) => ({
          ...settings,
          locationType: "upload" as const,
          geometry: parsed,
          fileName: file.name,
        }));

        setIsDrawing(true);
      } catch (uploadError) {
        setError(mapUploadError(uploadError as UploadErrorType));
      }
    },
    [setAnalysisSettings],
  );

  const handleConfirm = useCallback(() => {
    if (!geometry) return;
    postAnalysis(geometry);
  }, [geometry, postAnalysis]);

  const hasGeometry = !!geometry;
  const showConfirmation = isDrawing && hasGeometry;

  let Component = (
    <>
      <RichText>
        {(tags) =>
          t.rich("instructions", {
            ...tags,
          })
        }
      </RichText>
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon />
        <span>{t("upload-file")}</span>
      </Button>
      {error && (
        <Alert
          className="right-0 bg-red-100 text-red-600"
          variant="destructive"
        >
          <CircleAlertIcon aria-hidden />
          <AlertDescription className="text-red-600 text-sm font-medium leading-5">
            <RichText>{(tags) => t.rich(error, { ...tags })}</RichText>
          </AlertDescription>
        </Alert>
      )}
    </>
  );

  if (showConfirmation) {
    Component = (
      <>
        {locationType === "draw" ? (
          <RichText>
            {(tags) =>
              t.rich("verify-shape", {
                ...tags,
              })
            }
          </RichText>
        ) : (
          <p className="text-sm font-medium leading-5">
            {t("uploaded-file", { fileName: fileName ?? "" })}
          </p>
        )}
        {error && (
          <Alert
            className="right-0 bg-red-100 text-red-600"
            variant="destructive"
          >
            <CircleAlertIcon aria-hidden />
            <AlertDescription className="text-red-600 text-sm font-medium leading-5">
              <RichText>{(tags) => t.rich(error, { ...tags })}</RichText>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              resetState();
              setIsDrawing(false);
            }}
          >
            <TrashIcon />
            <span>{t("clear")}</span>
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!!error || !geometry || isPending}
          >
            <CheckIcon />
            <span>{t("confirm")}</span>
          </Button>
        </div>
      </>
    );
  }

  return (
    <PopoverContent
      side="bottom"
      align="start"
      className="flex flex-col gap-4 overflow-hidden w-[335px] text-sm font-medium leading-5 p-6"
      onInteractOutside={(e) => e.preventDefault()}
    >
      <TileIcon state={hasGeometry ? "checked" : "default"}>
        <QuestionMarkIcon />
      </TileIcon>
      {Component}
    </PopoverContent>
  );
};

export default UploadBar;
