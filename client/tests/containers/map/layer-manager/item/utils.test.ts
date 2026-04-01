import type { LayerProps } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";
import {
  getRasterLayerConfig,
  getVectorLayerConfig,
  hexToRgba,
  interpolateColormap,
} from "@/containers/map/layer-manager/item/utils";
import type { LayerConfig, TileInfoResponse } from "@/types";

vi.mock("@/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000" },
}));

vi.mock("@/lib/json-converter", () => ({
  parseConfig: vi.fn(({ config }) => config),
}));

const tileInfo: TileInfoResponse = {
  tilejson: "2.2.0",
  version: "1.0.0",
  scheme: "xyz",
  tiles: [],
  minzoom: 3,
  maxzoom: 12,
  bounds: [-96, 50, -78, 62],
  center: [-87, 56],
};

const baseConfig: LayerConfig = {
  colormap: [],
  styles: [{ type: "raster" } as LayerProps],
  params_config: [],
  legend_config: { type: "basic", items: [] },
};

describe("getRasterLayerConfig", () => {
  describe("tile URL", () => {
    it("uses the API base URL from env", () => {
      const { source } = getRasterLayerConfig({
        path: "temperature/2024.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      expect(tile).toMatch(/^http:\/\/localhost:8000/);
    });

    it("encodes the path in the tile URL", () => {
      const { source } = getRasterLayerConfig({
        path: "temperature/2024.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      expect(tile).toContain(
        `url=${encodeURIComponent("temperature/2024.tif")}`,
      );
    });

    it("uses colormap_name=viridis when withColormap is false", () => {
      const { source } = getRasterLayerConfig({
        path: "temperature/2024.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      expect(tile).toContain("colormap_name=viridis");
      expect(tile).not.toContain("&colormap=");
    });

    it("encodes a categorical array colormap as a discrete dict", () => {
      const config: LayerConfig = {
        ...baseConfig,
        colormap: [
          [1, "#ff0000"],
          [2, "#00ff00"],
        ],
      };

      const { source } = getRasterLayerConfig({
        path: "temperature/2024.tif",
        settings: {},
        tileInfo,
        config,
        withColormap: true,
        layerType: "categorical",
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      const encoded = encodeURIComponent(
        JSON.stringify({ "1": "#ff0000", "2": "#00ff00" }),
      );
      expect(tile).toContain(`colormap=${encoded}`);
      expect(tile).not.toContain("colormap_name=viridis");
    });

    it("encodes an object colormap in the tile URL when withColormap is true", () => {
      const config: LayerConfig = {
        ...baseConfig,
        colormap: { "1": "#ff0000", "2": "#00ff00" },
      };

      const { source } = getRasterLayerConfig({
        path: "temperature/2024.tif",
        settings: {},
        tileInfo,
        config,
        withColormap: true,
        layerType: "categorical",
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      const encoded = encodeURIComponent(
        JSON.stringify({ "1": "#ff0000", "2": "#00ff00" }),
      );
      expect(tile).toContain(`colormap=${encoded}`);
    });

    it("converts a choropleth paired-range colormap to interval format", () => {
      const config: LayerConfig = {
        ...baseConfig,
        colormap: [
          [0, "#0E2780"],
          [100, "#0E2780"],
          [101, "#01CB2A"],
          [200, "#01CB2A"],
        ],
      };

      const { source } = getRasterLayerConfig({
        path: "peat.tif",
        settings: {},
        tileInfo,
        config,
        withColormap: true,
        layerType: "choropleth",
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      const expected = [
        [
          [0, 99],
          [14, 39, 128, 255],
        ],
        [
          [100, 100],
          [14, 39, 128, 255],
        ],
        [
          [101, 199],
          [1, 203, 42, 255],
        ],
        [
          [200, 200],
          [1, 203, 42, 255],
        ],
      ];
      const encoded = encodeURIComponent(JSON.stringify(expected));
      expect(tile).toContain(`colormap=${encoded}`);
      expect(tile).not.toContain("colormap_name=viridis");
    });

    it("converts a choropleth breakpoint colormap to interval format", () => {
      const config: LayerConfig = {
        ...baseConfig,
        colormap: [
          [0, "#f7fbff"],
          [50, "#6baed6"],
          [100, "#08306b"],
        ],
      };

      const { source } = getRasterLayerConfig({
        path: "frequency.tif",
        settings: {},
        tileInfo,
        config,
        withColormap: true,
        layerType: "choropleth",
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      const expected = [
        [
          [0, 49],
          [247, 251, 255, 255],
        ],
        [
          [50, 99],
          [107, 174, 214, 255],
        ],
        [
          [100, 100],
          [8, 48, 107, 255],
        ],
      ];
      const encoded = encodeURIComponent(JSON.stringify(expected));
      expect(tile).toContain(`colormap=${encoded}`);
    });

    it("encodes a continuous colormap as a 256-entry interpolated gradient with rescale", () => {
      const config: LayerConfig = {
        ...baseConfig,
        colormap: [
          [0, "#000000"],
          [100, "#ffffff"],
        ],
      };

      const { source } = getRasterLayerConfig({
        path: "gradient.tif",
        settings: {},
        tileInfo,
        config,
        withColormap: true,
        layerType: "continuous",
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      // Should contain rescale param
      expect(tile).toContain("rescale=0%2C100");
      // Should contain a 256-entry colormap object
      expect(tile).toContain("colormap=");
      expect(tile).not.toContain("colormap_name=viridis");
      // Parse the colormap from the URL to verify it has 256 entries
      const colormapMatch = tile.match(/colormap=([^&]+)/);
      expect(colormapMatch).not.toBeNull();
      const decoded = JSON.parse(decodeURIComponent(colormapMatch![1]));
      expect(Object.keys(decoded)).toHaveLength(256);
      expect(decoded["0"]).toEqual([0, 0, 0, 255]);
      expect(decoded["255"]).toEqual([255, 255, 255, 255]);
    });
  });

  describe("tileInfo passthrough", () => {
    it("passes minzoom and maxzoom from tileInfo to the source", () => {
      const { source } = getRasterLayerConfig({
        path: "test.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      const s = source as Record<string, unknown>;
      expect(s.minzoom).toBe(3);
      expect(s.maxzoom).toBe(12);
    });

    it("passes bounds from tileInfo to the source", () => {
      const { source } = getRasterLayerConfig({
        path: "test.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      expect((source as Record<string, unknown>).bounds).toEqual([
        -96, 50, -78, 62,
      ]);
    });
  });

  describe("visibility", () => {
    it("sets visibility to visible when settings.visibility is true", () => {
      const { styles } = getRasterLayerConfig({
        path: "test.tif",
        settings: { visibility: true },
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      expect(styles[0].layout?.visibility).toBe("visible");
    });

    it("sets visibility to visible when settings.visibility is not set", () => {
      const { styles } = getRasterLayerConfig({
        path: "test.tif",
        settings: {},
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      expect(styles[0].layout?.visibility).toBe("visible");
    });

    it("sets visibility to none when settings.visibility is false", () => {
      const { styles } = getRasterLayerConfig({
        path: "test.tif",
        settings: { visibility: false },
        tileInfo,
        config: baseConfig,
        withColormap: false,
        layerType: undefined,
      });

      expect(styles[0].layout?.visibility).toBe("none");
    });
  });
});

describe("hexToRgba", () => {
  it("converts a hex color to an RGBA tuple with full opacity", () => {
    expect(hexToRgba("#0E2780")).toEqual([14, 39, 128, 255]);
  });

  it("handles hex without hash prefix", () => {
    expect(hexToRgba("ff0000")).toEqual([255, 0, 0, 255]);
  });

  it("converts black", () => {
    expect(hexToRgba("#000000")).toEqual([0, 0, 0, 255]);
  });

  it("converts white", () => {
    expect(hexToRgba("#ffffff")).toEqual([255, 255, 255, 255]);
  });
});

describe("interpolateColormap", () => {
  it("interpolates two stops into 256 entries", () => {
    const stops: [number, string][] = [
      [0, "#000000"],
      [100, "#ffffff"],
    ];
    const result = interpolateColormap(stops);

    // Returns object with string keys 0-255 and RGBA arrays
    expect(Object.keys(result)).toHaveLength(256);
    expect(result["0"]).toEqual([0, 0, 0, 255]);
    expect(result["255"]).toEqual([255, 255, 255, 255]);
    // Midpoint should be roughly [128, 128, 128, 255]
    expect(result["128"][0]).toBeGreaterThanOrEqual(127);
    expect(result["128"][0]).toBeLessThanOrEqual(129);
  });

  it("interpolates three stops correctly", () => {
    const stops: [number, string][] = [
      [0, "#ff0000"],
      [50, "#00ff00"],
      [100, "#0000ff"],
    ];
    const result = interpolateColormap(stops);

    expect(Object.keys(result)).toHaveLength(256);
    // At value 0 (index 0): pure red
    expect(result["0"]).toEqual([255, 0, 0, 255]);
    // At value 100 (index 255): pure blue
    expect(result["255"]).toEqual([0, 0, 255, 255]);
    // At value 50 (index ~128): pure green
    expect(result["128"][1]).toBeGreaterThanOrEqual(253);
  });

  it("handles single stop by filling all 256 entries with that color", () => {
    const stops: [number, string][] = [[50, "#ff0000"]];
    const result = interpolateColormap(stops);

    expect(Object.keys(result)).toHaveLength(256);
    expect(result["0"]).toEqual([255, 0, 0, 255]);
    expect(result["255"]).toEqual([255, 0, 0, 255]);
  });
});

describe("getVectorLayerConfig", () => {
  describe("source", () => {
    it("uses mapbox:// protocol in the source URL", () => {
      const { source } = getVectorLayerConfig({
        path: "my-org.tileset-id",
        settings: {},
        config: baseConfig,
      });

      expect((source as Record<string, unknown>).url).toBe(
        "mapbox://my-org.tileset-id",
      );
    });

    it("sets source type to vector", () => {
      const { source } = getVectorLayerConfig({
        path: "my-org.tileset-id",
        settings: {},
        config: baseConfig,
      });

      expect((source as Record<string, unknown>).type).toBe("vector");
    });
  });

  describe("visibility", () => {
    it("sets visibility to visible by default", () => {
      const { styles } = getVectorLayerConfig({
        path: "my-org.tileset-id",
        settings: {},
        config: baseConfig,
      });

      expect(styles[0].layout?.visibility).toBe("visible");
    });

    it("sets visibility to none when settings.visibility is false", () => {
      const { styles } = getVectorLayerConfig({
        path: "my-org.tileset-id",
        settings: { visibility: false },
        config: baseConfig,
      });

      expect(styles[0].layout?.visibility).toBe("none");
    });
  });
});
