import type { LayerProps, SourceProps } from "react-map-gl/mapbox";
import { env } from "@/env";
import { type Config, parseConfig } from "@/lib/json-converter";
import type { LayerConfig, TileInfoResponse } from "@/types";

type Rgba = [number, number, number, number];

export const hexToRgba = (hex: string): Rgba => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ];
};

/**
 * Convert an array colormap to TiTiler interval format.
 *
 * Handles two patterns found in metadata.json:
 *  - Paired ranges: consecutive entries share a color → [min, max] pair (step by 2).
 *    e.g. [[0,"#blue"],[100,"#blue"],[101,"#green"],[200,"#green"]]
 *  - Breakpoints: each entry has a unique color → interval runs until the next entry (step by 1).
 *    e.g. [[0,"#aaa"],[50,"#bbb"],[100,"#ccc"]]
 */
const toIntervalColormap = (
  colormap: [number, string][],
): [[number, number], Rgba][] => {
  const intervals: [[number, number], Rgba][] = [];
  let i = 0;

  while (i < colormap.length) {
    const [value, color] = colormap[i];
    const next = colormap[i + 1];

    if (next && next[1] === color) {
      // Paired range: the two entries share a color and define [min, max].
      intervals.push([[value, next[0]], hexToRgba(color)]);
      i += 2;
    } else {
      // Breakpoint: interval spans from this value to just before the next entry.
      const upperBound = next ? next[0] - 1 : value;
      intervals.push([[value, upperBound], hexToRgba(color)]);
      i += 1;
    }
  }

  return intervals;
};

const getColormapQueryParam = (
  colormap: LayerConfig["colormap"] | undefined,
  layerType: string | undefined,
): string => {
  if (!colormap) return "";

  if (Array.isArray(colormap) && layerType === "continuous") {
    return `&colormap=${encodeURIComponent(JSON.stringify(toIntervalColormap(colormap)))}`;
  }

  const colormapObject: Record<string, string> = Array.isArray(colormap)
    ? Object.fromEntries(
        colormap.map(([value, color]) => [String(Math.ceil(value)), color]),
      )
    : colormap;

  return `&colormap=${encodeURIComponent(JSON.stringify(colormapObject))}`;
};

export const getVectorLayerConfig = ({
  path,
  settings,
  config,
}: {
  path: string;
  settings: Record<string, unknown>;
  config: LayerConfig;
}) => {
  const { styles, params_config } = config;
  const visibility = settings.visibility ?? true;

  const c = parseConfig<Config>({
    config: {
      source: {
        url: `mapbox://${path}`,
        type: "vector",
      },
      styles: styles.map((style) => ({
        ...style,
        layout: {
          ...style.layout,
          visibility: visibility ? "visible" : "none",
        },
      })),
    },
    params_config,
    settings,
  });

  return {
    source: c?.source as SourceProps,
    styles: c?.styles as LayerProps[],
  };
};

export const getRasterLayerConfig = ({
  path,
  settings,
  tileInfo,
  config,
  withColormap,
  layerType,
}: {
  path: string;
  settings: Record<string, unknown>;
  tileInfo: TileInfoResponse;
  config: LayerConfig;
  withColormap: boolean;
  layerType: string | undefined;
}) => {
  const { styles, params_config, colormap } = config;
  const visibility = settings.visibility ?? true;
  const colormapQueryParam = withColormap
    ? getColormapQueryParam(colormap, layerType)
    : "&colormap_name=viridis";

  const c = parseConfig<Config>({
    config: {
      source: {
        type: "raster",
        tiles: [
          env.NEXT_PUBLIC_API_URL +
            `/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(
              path,
            )}${colormapQueryParam}`,
        ],
        minzoom: tileInfo.minzoom,
        maxzoom: tileInfo.maxzoom,
        bounds: tileInfo.bounds,
      },
      styles: styles.map((style) => ({
        ...style,
        layout: {
          ...style.layout,
          visibility: visibility ? "visible" : "none",
        },
      })),
    },
    params_config,
    settings,
  });

  return {
    source: c?.source as SourceProps,
    styles: c?.styles as LayerProps[],
  };
};
