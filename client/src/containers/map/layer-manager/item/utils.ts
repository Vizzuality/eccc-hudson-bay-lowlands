import type { LayerProps, SourceProps } from "react-map-gl/mapbox";
import { env } from "@/env";
import { type Config, parseConfig } from "@/lib/json-converter";
import type { LayerConfig, TileInfoResponse } from "@/types";

const getColormapQueryParam = (
  colormap: LayerConfig["colormap"] | undefined,
): string => {
  if (!colormap) return "";

  const colormapObject: Record<string, string> = Array.isArray(colormap)
    ? Object.fromEntries(
        colormap.map(([value, color]) => [String(value), color]),
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
}: {
  path: string;
  settings: Record<string, unknown>;
  tileInfo: TileInfoResponse;
  config: LayerConfig;
  withColormap: boolean;
}) => {
  const { styles, params_config, colormap } = config;
  const visibility = settings.visibility ?? true;
  const colormapQueryParam = withColormap
    ? getColormapQueryParam(colormap)
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
        // TODO: check with science if all rasters should have minzoom/maxzoom
        // returned by the TileJSON, or if fallbacks are expected.
        minzoom: tileInfo.minzoom ?? 0,
        maxzoom: tileInfo.maxzoom ?? 24,
        bounds: tileInfo.bounds,
      },
      styles: styles.map((style) => ({
        ...style,
        layout: {
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
