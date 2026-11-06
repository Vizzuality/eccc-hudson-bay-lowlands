import { useAtom } from "jotai";
import {
  MAP_TOUR_STEPS,
  MOBILE_MAP_TOUR_STEPS,
  type TourStep,
} from "@/containers/tour/steps";
import { tourStepIndexAtom } from "@/containers/tour/store";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function useMapTour(): {
  steps: TourStep[];
  index: number | null;
  step: TourStep | null;
  start: () => void;
  next: () => void;
  back: () => void;
  close: () => void;
} {
  const [index, setIndex] = useAtom(tourStepIndexAtom);
  const steps = useIsMobile() ? MOBILE_MAP_TOUR_STEPS : MAP_TOUR_STEPS;
  const lastIndex = steps.length - 1;

  return {
    steps,
    index,
    step: index === null ? null : (steps[index] ?? null),
    start: () => setIndex(0),
    next: () => setIndex((i) => (i === null || i >= lastIndex ? null : i + 1)),
    back: () => setIndex((i) => (i === null ? null : Math.max(0, i - 1))),
    close: () => setIndex(null),
  };
}
