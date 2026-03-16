import type { LayerProps } from "react-map-gl/mapbox";
import { describe, expect, it, vi } from "vitest";
import {
  getRasterLayerConfig,
  getVectorLayerConfig,
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
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      expect(tile).toContain("colormap_name=viridis");
      expect(tile).not.toContain("&colormap=");
    });

    it("encodes an array colormap in the tile URL when withColormap is true", () => {
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
      });

      const [tile] = (source as Record<string, unknown>).tiles as string[];
      const encoded = encodeURIComponent(
        JSON.stringify({ "1": "#ff0000", "2": "#00ff00" }),
      );
      expect(tile).toContain(`colormap=${encoded}`);
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
      });

      expect(styles[0].layout?.visibility).toBe("none");
    });
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
