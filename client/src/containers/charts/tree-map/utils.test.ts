import { describe, expect, it } from "vitest";
import { layoutLabel } from "@/containers/charts/tree-map/utils";

const CHAR_WIDTH = 7;
const PADDING = 8;

const widthFor = (text: string) => text.length * CHAR_WIDTH + PADDING;

describe("layoutLabel", () => {
  it("fits a single short word on one line", () => {
    const result = layoutLabel("Forest", 200, CHAR_WIDTH);

    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["Forest"]);
  });

  it("wraps to two lines when one line is too narrow", () => {
    const width = widthFor("wetlands");

    const result = layoutLabel("Coastal wetlands", width, CHAR_WIDTH);

    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["Coastal", "wetlands"]);
  });

  it("does not fit when text overflows two lines", () => {
    const width = widthFor("wetlands");

    const result = layoutLabel("Coastal wetlands and bogs", width, CHAR_WIDTH);

    expect(result.fits).toBe(false);
    expect(result.lines).toEqual([]);
  });

  it("does not fit when a single word is wider than the cell", () => {
    const result = layoutLabel("Permafrost", widthFor("Perma"), CHAR_WIDTH);

    expect(result.fits).toBe(false);
    expect(result.lines).toEqual([]);
  });

  it("packs as many words as fit before wrapping (boundary)", () => {
    const width = widthFor("Open peat");

    const result = layoutLabel("Open peat land", width, CHAR_WIDTH);

    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["Open peat", "land"]);
  });

  it("does not fit an empty label", () => {
    const result = layoutLabel("   ", 200, CHAR_WIDTH);

    expect(result.fits).toBe(false);
    expect(result.lines).toEqual([]);
  });
});
