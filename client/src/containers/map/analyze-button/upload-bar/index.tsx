import type { Feature } from "geojson";
import {
  CheckIcon,
  CircleAlertIcon,
  CloudUploadIcon,
  TrashIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PopoverContent } from "@/components/ui/popover";
import { MAX_AREA_SIZE_SQUARE_METER } from "@/containers/map/analyze-button/upload-bar/constants";
import { DESKTOP_MAX_BOUNDS } from "@/containers/map/constants";
import useAnalysisSettings from "@/hooks/use-analysis-settings";
import useMapDraw from "@/hooks/use-map-draw";
import { format } from "@/lib/utils/format";
import type { convertFilesToGeojson } from "@/lib/utils/geometry-upload";
import {
  validateGeoJSONBounds,
  validateGeoJSONSize,
} from "@/lib/utils/geometry-upload";

const UploadBar = () => {
  const { mapStatus } = useMapStatus();
  const [isDrawing, setIsDrawing] = useState(false);
  const locale = useLocale();
  const t = useTranslations("analysis");

  const [drawError, setDrawError] = useState<ReactNode | null>(null);
  const [{ geometry }, setAnalysisSettings] = useAnalysisSettings();

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
          t.rich(!isValidSize ? "area-too-big" : "outside-of-bounds", {
            b: (chunk) => <span className="font-semibold">{chunk}</span>,
            area_sq_km: format(locale, MAX_AREA_SIZE_SQUARE_METER / 1000000),
          }),
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
    [locale, setAnalysisSettings, t],
  );

  const { redraw } = useMapDraw({
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
    <>
      <p>{t("instructions")}</p>
      <Button className="w-full" type="button">
        <CloudUploadIcon />
        <span>{t("upload")}</span>
      </Button>
    </>
  );

  if (isDrawing) {
    Component = (
      <>
        {drawError ? (
          <Alert className="right-0" variant="destructive">
            <CircleAlertIcon aria-hidden />
            <AlertDescription>
              <p>{drawError}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <p>{t("verify-shape")}</p>
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
            onClick={() => setIsDrawing(false)}
            disabled={!!drawError}
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
      className="flex flex-col gap-4 overflow-hidden max-w-[335px] text-sm"
      onInteractOutside={(e) => e.preventDefault()}
    >
      {Component}
    </PopoverContent>
  );
};

export default UploadBar;
