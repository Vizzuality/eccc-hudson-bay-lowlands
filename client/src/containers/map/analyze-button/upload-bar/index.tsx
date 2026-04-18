import { useMutation } from "@tanstack/react-query";
import type { Feature } from "geojson";
import { CheckIcon, CircleAlertIcon, TrashIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import QuestionMarkIcon from "@/components/icons/question-mark";
import TileIcon from "@/components/icons/tile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import RichText from "@/components/ui/rich-text";
import { MAX_AREA_SIZE_SQUARE_METER } from "@/containers/map/analyze-button/upload-bar/constants";
import { DESKTOP_MAX_BOUNDS } from "@/containers/map/constants";
import useAnalysisSettings, {
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";
import useMapDraw from "@/hooks/use-map-draw";
import { API } from "@/lib/api";
import { postAnalysisConfig } from "@/lib/api/config";
import { format } from "@/lib/utils/format";
import type { convertFilesToGeojson } from "@/lib/utils/geometry-upload";
import {
  validateGeoJSONBounds,
  validateGeoJSONSize,
} from "@/lib/utils/geometry-upload";
import type { AnalysisResponse } from "@/types";

const UploadBar = () => {
  const { mapStatus, setMapStatus } = useMapStatus();
  const [isDrawing, setIsDrawing] = useState(false);
  const locale = useLocale();
  const t = useTranslations("analysis");

  const [drawError, setDrawError] = useState<
    "area-too-big" | "outside-of-bounds" | "generic-error" | null
  >(null);
  const [{ geometry }, setAnalysisSettings] = useAnalysisSettings();
  const setAnalysisResult = useSetAnalysisResult();
  const { mutate: postAnalysis, isPending } = useMutation({
    mutationFn: (geometry: GeoJSON.Feature) =>
      API<AnalysisResponse>(postAnalysisConfig(geometry)),
    onSuccess: (data) => {
      setAnalysisResult(data);
      setAnalysisSettings((settings) => ({ ...settings, geometry: null }));
      setMapStatus(MapStatus.analysis);
    },
    onError: () => {
      setDrawError("generic-error");
    },
  });

  const onUpdateGeometry = useCallback(
    ({ features }: { features: Feature[] }) => {
      const geometry =
        (features[0] as Awaited<ReturnType<typeof convertFilesToGeojson>>) ??
        null;

      const isValidSize = validateGeoJSONSize(
        geometry,
        MAX_AREA_SIZE_SQUARE_METER,
      );
      const isValidBounds = validateGeoJSONBounds(geometry, DESKTOP_MAX_BOUNDS);

      if (!isValidSize || !isValidBounds) {
        setDrawError(
          !isValidSize
            ? "area-too-big"
            : isValidBounds
              ? "outside-of-bounds"
              : null,
        );

        setAnalysisSettings((settings) => ({
          ...settings,
          geometry: null,
        }));

        return;
      }

      setDrawError(null);

      setAnalysisSettings((settings) => ({
        ...settings,
        geometry,
      }));
    },
    [setAnalysisSettings],
  );

  const { redraw } = useMapDraw({
    enabled: mapStatus === MapStatus.upload,
    geometry: geometry ?? undefined,
    onCreate: onUpdateGeometry,
    onUpdate: onUpdateGeometry,
    onDrawingStart: () => setIsDrawing(true),
  });

  const onClickRedraw = useCallback(() => {
    redraw();

    setDrawError(null);

    setAnalysisSettings((settings) => ({
      ...settings,
      geometry: null,
    }));
  }, [setAnalysisSettings, redraw]);

  useEffect(() => {
    if (mapStatus === MapStatus.default) {
      onClickRedraw();
      if (isDrawing) {
        setIsDrawing(false);
      }
    }
  }, [mapStatus, isDrawing, onClickRedraw]);

  let Component = (
    <RichText>
      {(tags) =>
        t.rich("instructions", {
          ...tags,
        })
      }
    </RichText>
  );

  if (isDrawing) {
    Component = (
      <>
        <RichText>
          {(tags) =>
            t.rich("verify-shape", {
              ...tags,
            })
          }
        </RichText>
        {drawError && (
          <Alert
            className="right-0 bg-red-100 text-red-600"
            variant="destructive"
          >
            <CircleAlertIcon aria-hidden />
            <AlertDescription className="text-red-600 text-sm font-medium leading-5">
              <RichText>
                {(tags) =>
                  t.rich("area-too-big", {
                    ...tags,
                    area_sq_km: format(
                      locale,
                      MAX_AREA_SIZE_SQUARE_METER / 1000000,
                    ),
                  })
                }
              </RichText>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onClickRedraw();
              setIsDrawing(false);
            }}
          >
            <TrashIcon />
            <span>{t("clear")}</span>
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (!geometry) return;

              postAnalysis(geometry);
              setIsDrawing(false);
            }}
            disabled={!!drawError || !geometry || isPending}
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
      <TileIcon state={geometry ? "checked" : "default"}>
        <QuestionMarkIcon />
      </TileIcon>
      {Component}
    </PopoverContent>
  );
};

export default UploadBar;
