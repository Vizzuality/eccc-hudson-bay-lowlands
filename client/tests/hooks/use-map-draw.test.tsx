import { renderHook } from "@testing-library/react";
import type { Feature, Polygon } from "geojson";
import { describe, expect, it, vi } from "vitest";
import useMapDraw from "@/hooks/use-map-draw";

const listeners: Record<string, Array<() => void>> = {};
let ring: number[][] = [];
const drawCalls: string[] = [];

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
    changeMode = (mode: string) => drawCalls.push(`changeMode:${mode}`);
    deleteAll = () => drawCalls.push("deleteAll");
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

  it("restarts polygon drawing after a drawn geometry is cleared", () => {
    const geometry: Feature<Polygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-82, 53],
            [-81, 53],
            [-81, 54],
            [-82, 53],
          ],
        ],
      },
    };
    const { rerender } = renderHook(
      ({ geometry }: { geometry?: Feature<Polygon> }) =>
        useMapDraw({ enabled: true, geometry }),
      { initialProps: { geometry } as { geometry?: Feature<Polygon> } },
    );

    drawCalls.length = 0;
    rerender({ geometry: undefined });

    const lastDeleteAll = drawCalls.lastIndexOf("deleteAll");
    expect(lastDeleteAll).toBeGreaterThanOrEqual(0);
    expect(drawCalls.slice(lastDeleteAll + 1)).toContain(
      "changeMode:draw_polygon",
    );
  });
});
