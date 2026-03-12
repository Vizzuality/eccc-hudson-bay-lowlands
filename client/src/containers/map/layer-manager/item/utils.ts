import type { LayerProps, SourceProps } from "react-map-gl/mapbox";
import { env } from "@/env";
import { type Config, parseConfig } from "@/lib/json-converter";
import type { TileInfoResponse } from "@/types";

export const getVectorLayerConfig = (
  path: string,
  settings: Record<string, unknown>,
) => {
  const visibility = settings.visibility ?? true;

  const c = parseConfig<Config>({
    config: {
      source: {
        url: `mapbox://${path}`,
        type: "vector",
      },
      styles: [
        {
          type: "fill",
          layout: {
            visibility: visibility ? "visible" : "none",
          },
        },
      ],
    },
    params_config: [
      {
        key: "visibility",
        default: true,
      },
    ],
    settings,
  });

  const source = c?.source as SourceProps;
  const styles = c?.styles as LayerProps[];

  return {
    source,
    styles,
  };
};

export const getRasterLayerConfig = ({
  path,
  settings,
  tileInfo,
}: {
  path: string;
  settings: Record<string, unknown>;
  tileInfo: TileInfoResponse;
}) => {
  const visibility = settings.visibility ?? true;
  const c = parseConfig<Config>({
    config: {
      source: {
        type: "raster",
        tiles: [
          env.NEXT_PUBLIC_API_URL +
            `/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(path)}&colormap_name=viridis`,
        ],
        minzoom: tileInfo.minzoom,
        maxzoom: tileInfo.maxzoom,
        bounds: tileInfo.bounds,
      },
      styles: [
        {
          type: "raster",
          layout: {
            visibility: visibility ? "visible" : "none",
          },
        },
      ],
    },
    params_config: [
      {
        key: "visibility",
        default: true,
      },
    ],
    settings,
  });

  const source = c?.source as SourceProps;
  const styles = c?.styles as LayerProps[];

  return {
    source,
    styles,
  };
};
