export type TourStepId =
  | "find-data"
  | "add-layers"
  | "control-layers"
  | "analyze"
  | "all-set"
  | "mobile-find-data"
  | "mobile-analyze"
  | "mobile-all-set";

export interface TourStep {
  id: TourStepId;
  selector: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  shape: "rounded" | "pill";
  hotspotSelector?: string;
  counted: boolean;
}

export const MAP_TOUR_STEPS: TourStep[] = [
  {
    id: "find-data",
    selector: '[data-tour="main-sidebar"] [data-tour="find-data"]',
    side: "right",
    align: "center",
    shape: "rounded",
    counted: true,
  },
  {
    id: "add-layers",
    selector: '[data-tour="main-sidebar"] [data-tour="layer-row"]',
    side: "right",
    align: "start",
    shape: "rounded",
    counted: true,
  },
  {
    id: "control-layers",
    selector: "[data-map-legend]",
    side: "top",
    align: "start",
    shape: "rounded",
    hotspotSelector: "[data-map-legend] [data-tour-hotspot]",
    counted: true,
  },
  {
    id: "analyze",
    selector: '[data-tour="analyze"]',
    side: "bottom",
    align: "start",
    shape: "pill",
    counted: true,
  },
  {
    id: "all-set",
    selector: '[data-tour="map-controls"]',
    side: "left",
    align: "start",
    shape: "pill",
    counted: false,
  },
];

export const MOBILE_MAP_TOUR_STEPS: TourStep[] = [
  {
    id: "mobile-find-data",
    selector: '[data-tour="mobile-data"]',
    side: "top",
    align: "center",
    shape: "pill",
    counted: true,
  },
  {
    id: "mobile-analyze",
    selector: '[data-tour="mobile-analyze"]',
    side: "top",
    align: "end",
    shape: "pill",
    counted: true,
  },
  {
    id: "mobile-all-set",
    selector: '[data-tour="map-controls"]',
    side: "left",
    align: "start",
    shape: "pill",
    counted: false,
  },
];
