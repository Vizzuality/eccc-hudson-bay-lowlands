import { act, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MushkegowukMask } from "@/containers/map/mushkegowuk-mask";

const map = vi.hoisted(() => ({
  layerIds: [] as string[],
  onStyleData: undefined as (() => void) | undefined,
  getStyle() {
    return { layers: this.layerIds.map((id) => ({ id })) };
  },
  on(_: string, handler: () => void) {
    this.onStyleData = handler;
  },
  off() {},
}));

vi.mock("react-map-gl/mapbox", () => ({
  useMap: () => ({ current: map }),
  Source: ({ children }: PropsWithChildren) => <div>{children}</div>,
  Layer: ({ id, beforeId }: { id: string; beforeId?: string }) => (
    <div data-testid={id} data-before-id={beforeId} />
  ),
}));

describe("MushkegowukMask", () => {
  beforeEach(() => {
    map.onStyleData = undefined;
  });

  it("moves its layers above the mask of the new style after a basemap switch", () => {
    map.layerIds = ["custom-layers", "default-mask-layer", "state-label"];
    const { getByTestId } = render(<MushkegowukMask />);

    map.layerIds = [
      "custom-layers",
      "default-mask-layer",
      "mushkegowuk-mask-fill",
      "mushkegowuk-mask-line",
      "continent-label copy",
    ];
    act(() => map.onStyleData?.());

    for (const id of ["mushkegowuk-mask-fill", "mushkegowuk-mask-line"]) {
      expect(getByTestId(id).dataset.beforeId).toBe("continent-label copy");
    }
  });

  it("renders nothing when the style has no mask", () => {
    map.layerIds = ["custom-layers", "state-label"];

    const { container } = render(<MushkegowukMask />);

    expect(container.innerHTML).toBe("");
  });
});
