"use client";

import { useAtomValue } from "jotai";
import { CircleQuestionMarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tourAvailableAtom } from "@/containers/tour/store";
import { useMapTour } from "@/containers/tour/use-map-tour";
import { CONTROL_BUTTON_STYLES } from "../constants";

export default function HelpControl() {
  const available = useAtomValue(tourAvailableAtom);
  const { start } = useMapTour();
  const t = useTranslations("map.controls.help");

  if (!available) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t("aria-label")}
          className={CONTROL_BUTTON_STYLES.default}
          onClick={start}
        >
          <CircleQuestionMarkIcon className={CONTROL_BUTTON_STYLES.icon} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{t("tooltip")}</TooltipContent>
    </Tooltip>
  );
}
