"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { ANALYSIS_TOUR_STEPS } from "@/containers/tour/analysis-steps";
import { analysisTourAvailableAtom } from "@/containers/tour/analysis-store";
import { Spotlight } from "@/containers/tour/spotlight";
import { TourCard } from "@/containers/tour/tour-card";
import { useAnalysisTour } from "@/containers/tour/use-analysis-tour";
import { useTargetRect } from "@/containers/tour/use-target-rect";
import { useIsMobile } from "@/hooks/use-is-mobile";

const TOTAL_COUNTED = ANALYSIS_TOUR_STEPS.filter((step) => step.counted).length;

export default function AnalysisTour() {
  const t = useTranslations("analysis-tour");
  const isMobile = useIsMobile();
  const { mapStatus } = useMapStatus();
  const setAvailable = useSetAtom(analysisTourAvailableAtom);
  const { index, step, next, back, close } = useAnalysisTour();
  const anchorRef = useRef<HTMLDivElement>(null);
  const rect = useTargetRect(step?.selector ?? null);
  const available = !isMobile && mapStatus === MapStatus.analysis;

  useEffect(() => {
    setAvailable(available);
    if (!available) close();
  }, [available, setAvailable, close]);

  useEffect(() => () => setAvailable(false), [setAvailable]);

  if (index === null || !step || !available) return null;

  const current = ANALYSIS_TOUR_STEPS.slice(0, index + 1).filter(
    (s) => s.counted,
  ).length;

  return (
    <>
      {createPortal(
        <Spotlight ref={anchorRef} rect={rect} shape={step.shape} />,
        document.body,
      )}
      <TourCard
        step={step}
        stepsNamespace="analysis-tour"
        finishLabel={t("got-it")}
        current={current}
        total={TOTAL_COUNTED}
        anchorRef={anchorRef}
        hasTarget={!!rect}
        isFirst={index === 0}
        isLast={index === ANALYSIS_TOUR_STEPS.length - 1}
        onNext={next}
        onBack={back}
        onClose={close}
      />
    </>
  );
}
