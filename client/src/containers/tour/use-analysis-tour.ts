import { useAtom, useSetAtom } from "jotai";
import {
  ANALYSIS_TOUR_STEPS,
  type AnalysisTourStepId,
} from "@/containers/tour/analysis-steps";
import {
  analysisTourNudgeDismissedAtom,
  analysisTourStepIndexAtom,
} from "@/containers/tour/analysis-store";
import type { TourStep } from "@/containers/tour/steps";

export function useAnalysisTour(): {
  index: number | null;
  step: TourStep<AnalysisTourStepId> | null;
  start: () => void;
  next: () => void;
  back: () => void;
  close: () => void;
} {
  const [index, setIndex] = useAtom(analysisTourStepIndexAtom);
  const setNudgeDismissed = useSetAtom(analysisTourNudgeDismissedAtom);
  const lastIndex = ANALYSIS_TOUR_STEPS.length - 1;

  return {
    index,
    step: index === null ? null : ANALYSIS_TOUR_STEPS[index],
    start: () => {
      setNudgeDismissed(true);
      setIndex(0);
    },
    next: () => setIndex((i) => (i === null || i >= lastIndex ? null : i + 1)),
    back: () => setIndex((i) => (i === null ? null : Math.max(0, i - 1))),
    close: () => setIndex(null),
  };
}
