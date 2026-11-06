import type { TourStep } from "@/containers/tour/steps";

export type AnalysisTourStepId =
  | "topic-card"
  | "topic-tabs"
  | "topic-actions"
  | "all-set";

export const ANALYSIS_TOUR_STEPS: TourStep<AnalysisTourStepId>[] = [
  {
    id: "topic-card",
    selector: '[data-tour="topic-cards"]',
    side: "right",
    align: "start",
    shape: "rounded",
    counted: true,
  },
  {
    id: "topic-tabs",
    selector: '[data-tour="topic-tabs"]',
    side: "bottom",
    align: "start",
    shape: "rounded",
    counted: true,
  },
  {
    id: "topic-actions",
    selector: '[data-tour="topic-actions"]',
    side: "bottom",
    align: "start",
    shape: "pill",
    counted: true,
  },
  {
    id: "all-set",
    selector: '[data-tour="help"]',
    side: "left",
    align: "start",
    shape: "pill",
    counted: false,
  },
];
