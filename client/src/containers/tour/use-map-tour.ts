import { useAtom } from "jotai";
import { MAP_TOUR_STEPS, type TourStep } from "@/containers/tour/steps";
import { tourStepIndexAtom } from "@/containers/tour/store";

export function useMapTour(): {
  index: number | null;
  step: TourStep | null;
  start: () => void;
  next: () => void;
  back: () => void;
  close: () => void;
} {
  const [index, setIndex] = useAtom(tourStepIndexAtom);
  const lastIndex = MAP_TOUR_STEPS.length - 1;

  return {
    index,
    step: index === null ? null : MAP_TOUR_STEPS[index],
    start: () => setIndex(0),
    next: () => setIndex((i) => (i === null || i >= lastIndex ? null : i + 1)),
    back: () => setIndex((i) => (i === null ? null : Math.max(0, i - 1))),
    close: () => setIndex(null),
  };
}
