import { describe, expect, it } from "vitest";
import { getLayerAboveMask } from "@/containers/map/layer-manager/utils";

describe("getLayerAboveMask", () => {
  it("returns the layer after the mask, skipping its own layers", () => {
    expect(
      getLayerAboveMask(
        ["custom-layers", "default-mask-layer", "fill", "line", "state-label"],
        ["fill", "line"],
      ),
    ).toBe("state-label");
  });

  it("returns null when the style has no mask", () => {
    expect(getLayerAboveMask(["custom-layers", "state-label"], ["fill"])).toBe(
      null,
    );
  });
});
