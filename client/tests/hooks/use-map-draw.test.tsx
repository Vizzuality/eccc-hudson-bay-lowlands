import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useMapDraw from "@/hooks/use-map-draw";

const listeners: Record<string, Array<() => void>> = {};
let ring: number[][] = [];

const fakeMap = {
  on: (type: string, fn: () => void) => {
    listeners[type] = [...(listeners[type] ?? []), fn];
  },
  off: () => {},
  hasControl: () => true,
  addControl: () => {},
  removeControl: () => {},
  getMap: () => ({
    doubleClickZoom: { enable: () => {}, disable: () => {} },
  }),
};

vi.mock("react-map-gl/mapbox", () => ({
  useMap: () => ({ default: fakeMap }),
}));

vi.mock("@mapbox/mapbox-gl-draw", () => ({
  default: class {
    static modes = {};
    getMode = () => "draw_polygon";
    changeMode = () => {};
    deleteAll = () => {};
    add = () => {};
    getAll = () => ({
      features: [{ geometry: { type: "Polygon", coordinates: [ring] } }],
    });
  },
}));

const emit = (type: string) => {
  for (const fn of listeners[type] ?? []) fn();
};

describe("@hooks/use-map-draw", () => {
  it("reports drawing start when a touch tap adds the first point", () => {
    const onDrawingStart = vi.fn();
    renderHook(() => useMapDraw({ onDrawingStart }));

    ring = [];
    emit("touchend");
    expect(onDrawingStart).not.toHaveBeenCalled();

    ring = [[-82, 53]];
    emit("touchend");
    expect(onDrawingStart).toHaveBeenCalledTimes(1);
  });
});
