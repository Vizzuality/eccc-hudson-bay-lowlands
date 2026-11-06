"use client";

import { useAtomValue } from "jotai";
import { CircleQuestionMarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { analysisTourAvailableAtom } from "@/containers/tour/analysis-store";
import {
  AnalysisTourNudge,
  useAnalysisTourNudgeVisible,
} from "@/containers/tour/analysis-tour-nudge";
import { tourAvailableAtom } from "@/containers/tour/store";
import { useAnalysisTour } from "@/containers/tour/use-analysis-tour";
import { useMapTour } from "@/containers/tour/use-map-tour";
import { CONTROL_BUTTON_STYLES } from "../constants";

export default function HelpControl() {
  const available = useAtomValue(tourAvailableAtom);
  const analysisAvailable = useAtomValue(analysisTourAvailableAtom);
  const { start } = useMapTour();
  const { start: startAnalysisTour } = useAnalysisTour();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("map.controls.help");
  const nudgeVisible = useAnalysisTourNudgeVisible(analysisAvailable);

  if (!available && !analysisAvailable) return null;

  return (
    <>
      <Tooltip open={nudgeVisible ? false : undefined}>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            data-tour="help"
            aria-label={t("aria-label")}
            className={CONTROL_BUTTON_STYLES.default}
            onClick={analysisAvailable ? startAnalysisTour : start}
          >
            <CircleQuestionMarkIcon className={CONTROL_BUTTON_STYLES.icon} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{t("tooltip")}</TooltipContent>
      </Tooltip>
      {nudgeVisible && (
        <AnalysisTourNudge anchorRef={buttonRef} onStart={startAnalysisTour} />
      )}
    </>
  );
}
