import { describe, expect, it } from "vitest";
import {
  getLayerAboveMask,
  getLayerPlacements,
  pinAboveMaskLayers,
} from "@/containers/map/layer-manager/utils";

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

describe("getLayerPlacements", () => {
  const aboveMask = new Set(["territory"]);

  it("anchors above-mask layers above the mask and chains the rest from the base layer", () => {
    expect(
      getLayerPlacements(
        ["flood", "territory", "peat"],
        aboveMask,
        "custom-layers",
        "road-street",
      ),
    ).toEqual([
      { id: "territory", beforeId: "road-street" },
      { id: "flood", beforeId: "custom-layers" },
      { id: "peat", beforeId: "flood-layer" },
    ]);
  });

  it("chains above-mask layers from the base layer when the style has no mask", () => {
    expect(
      getLayerPlacements(
        ["flood", "territory"],
        aboveMask,
        "custom-layers",
        null,
      ),
    ).toEqual([
      { id: "territory", beforeId: "custom-layers" },
      { id: "flood", beforeId: "territory-layer" },
    ]);
  });
});

describe("pinAboveMaskLayers", () => {
  it("keeps above-mask layers at the top when dropped below a normal layer", () => {
    expect(
      pinAboveMaskLayers(
        ["flood", "territory", "peat"],
        new Set(["territory"]),
      ),
    ).toEqual(["territory", "flood", "peat"]);
  });
});
