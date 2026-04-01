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

/** Convert an array colormap to TiTiler interval format. */
const toIntervalColormap = (
  colormap: [number, string][],
): [[number, number], Rgba][] =>
  colormap.map(([value, color], i) => {
    const next = colormap[i + 1];
    const upperBound = next ? next[0] - 1 : value;
    return [[value, upperBound], hexToRgba(color)];
  });

/** Linearly interpolate between colormap stops to produce a 256-entry discrete colormap.
 *  Each key is an index 0-255 mapping to an RGBA array.
 *  Used with TiTiler's `rescale` param to map the data range to 0-255.
 */
export const interpolateColormap = (
  colormap: [number, string][],
): Record<string, Rgba> => {
  if (colormap.length === 0) return {};

  const rgbaStops = colormap.map(
    ([value, color]) => [value, hexToRgba(color)] as const,
  );

  if (rgbaStops.length === 1) {
    const [, rgba] = rgbaStops[0];
    return Object.fromEntries(
      Array.from({ length: 256 }, (_, i) => [String(i), [...rgba]]),
    );
  }

  const minVal = rgbaStops[0][0];
  const maxVal = rgbaStops[rgbaStops.length - 1][0];
  const range = maxVal - minVal || 1;

  const result: Record<string, Rgba> = {};
  for (let i = 0; i < 256; i++) {
    const dataValue = minVal + (i / 255) * range;

    let lowerIdx = 0;
    for (let s = 0; s < rgbaStops.length - 1; s++) {
      if (rgbaStops[s + 1][0] >= dataValue) {
        lowerIdx = s;
        break;
      }
      lowerIdx = s;
    }
    const upperIdx = Math.min(lowerIdx + 1, rgbaStops.length - 1);

    const [lowerVal, lowerRgba] = rgbaStops[lowerIdx];
    const [upperVal, upperRgba] = rgbaStops[upperIdx];

    const segmentRange = upperVal - lowerVal || 1;
    const t = Math.max(0, Math.min(1, (dataValue - lowerVal) / segmentRange));

    result[String(i)] = [
      Math.round(lowerRgba[0] + t * (upperRgba[0] - lowerRgba[0])),
      Math.round(lowerRgba[1] + t * (upperRgba[1] - lowerRgba[1])),
      Math.round(lowerRgba[2] + t * (upperRgba[2] - lowerRgba[2])),
      255,
    ];
  }

  return result;
};

const getColormapQueryParam = (
  colormap: LayerConfig["colormap"] | undefined,
  layerType: string | undefined,
): string => {
  if (!colormap) return "";

  if (Array.isArray(colormap) && layerType === "choropleth") {
    return `&colormap=${encodeURIComponent(JSON.stringify(toIntervalColormap(colormap)))}`;
  }

  if (Array.isArray(colormap) && layerType === "continuous") {
    const minVal = colormap[0][0];
    const maxVal = colormap[colormap.length - 1][0];
    const rescale = `&rescale=${encodeURIComponent(`${minVal},${maxVal}`)}`;
    const interpolated = interpolateColormap(colormap);
    return `${rescale}&colormap=${encodeURIComponent(JSON.stringify(interpolated))}`;
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
