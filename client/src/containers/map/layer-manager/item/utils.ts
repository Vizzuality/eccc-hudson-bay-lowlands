import type { RasterSourceSpecification } from "mapbox-gl";
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

const GRADIENT_STEPS = 128;

/** Linearly interpolate between colormap stops to produce interval entries.
 *  Returns 128 intervals covering the full data range with smoothly graded colors.
 *  Uses TiTiler interval format so no `rescale` param is needed.
 */
export const interpolateColormap = (
  colormap: [number, string][],
): [[number, number], Rgba][] => {
  if (colormap.length === 0) return [];

  const rgbaStops = colormap.map(
    ([value, color]) => [value, hexToRgba(color)] as const,
  );

  if (rgbaStops.length === 1) {
    const [value, rgba] = rgbaStops[0];
    return [[[value, value], [...rgba] as Rgba]];
  }

  const minVal = rgbaStops[0][0];
  const maxVal = rgbaStops[rgbaStops.length - 1][0];
  const range = maxVal - minVal || 1;
  const step = range / GRADIENT_STEPS;

  return Array.from({ length: GRADIENT_STEPS }, (_, i) => {
    const lower = minVal + i * step;
    const upper = i === GRADIENT_STEPS - 1 ? maxVal : minVal + (i + 1) * step;
    const dataValue = i === GRADIENT_STEPS - 1 ? maxVal : lower;

    let lowerIdx = rgbaStops.length - 2;
    for (let s = 0; s < rgbaStops.length - 1; s++) {
      if (rgbaStops[s + 1][0] >= dataValue) {
        lowerIdx = s;
        break;
      }
    }
    const upperIdx = Math.min(lowerIdx + 1, rgbaStops.length - 1);

    const [lowerVal, lowerRgba] = rgbaStops[lowerIdx];
    const [upperVal, upperRgba] = rgbaStops[upperIdx];

    const segmentRange = upperVal - lowerVal || 1;
    const t = Math.max(0, Math.min(1, (dataValue - lowerVal) / segmentRange));

    const rgba: Rgba = [
      Math.round(lowerRgba[0] + t * (upperRgba[0] - lowerRgba[0])),
      Math.round(lowerRgba[1] + t * (upperRgba[1] - lowerRgba[1])),
      Math.round(lowerRgba[2] + t * (upperRgba[2] - lowerRgba[2])),
      255,
    ];

    return [[lower, upper], rgba] as [[number, number], Rgba];
  });
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
    return `&colormap=${encodeURIComponent(JSON.stringify(interpolateColormap(colormap)))}`;
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

/**
 * Transform a raster source for high-DPI displays by inserting a TiTiler scale suffix
 * (`@{scale}x`) into tile URLs and setting the corresponding `tileSize`.
 *
 * If the source has no `tiles` array (e.g. TileJSON `url`), it is returned unchanged.
 */
export function applyHighDpiToRasterSource(
  source: RasterSourceSpecification,
  devicePixelRatio: number,
): RasterSourceSpecification {
  if (!source.tiles) {
    return source;
  }

  // Clamp to the tiler's maximum supported scale (min 1, max 4)
  const scale = Math.max(1, Math.min(Math.ceil(devicePixelRatio), 4));

  return {
    ...source,
    tiles: source.tiles.map((url) =>
      url.replace(/\.png(\?|$)/, `@${scale}x.png$1`),
    ),
    tileSize: scale * 256,
  };
}

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
