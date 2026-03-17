import type { LayerProps, SourceProps } from "react-map-gl/mapbox";
import { env } from "@/env";
import { type Config, parseConfig } from "@/lib/json-converter";
import type { LayerConfig, TileInfoResponse } from "@/types";

const COLOR_FIELDS = [
  "color",
  "fill_color",
  "stroke_color",
  "Color",
  "fill",
  "stroke",
];

const getColorExpression = (fields: Record<string, string>) => {
  const colorField = COLOR_FIELDS.find((f) => f in fields);
  return colorField ? (["get", colorField] as unknown) : "#888888";
};

export const getDefaultVectorConfigFromTileJSON = (
  vectorLayers: {
    id: string;
    geometry_type?: string;
    fields?: Record<string, string>;
  }[],
): LayerConfig => ({
  styles: vectorLayers.map((vl) => {
    const color = getColorExpression(vl.fields ?? {});
    const type =
      vl.geometry_type === "Point"
        ? "circle"
        : vl.geometry_type === "LineString"
          ? "line"
          : "fill";
    const paint =
      type === "fill"
        ? { "fill-color": color, "fill-opacity": 0.5 }
        : type === "circle"
          ? { "circle-color": color, "circle-radius": 4 }
          : { "line-color": color, "line-width": 1 };
    return { "source-layer": vl.id, type, paint };
  }) as LayerProps[],
  params_config: [
    { key: "opacity", default: 1 },
    { key: "visibility", default: true },
  ],
  legend_config: { type: "basic", items: [] },
  colormap: {},
});

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
  tileJSON,
}: {
  path: string;
  settings: Record<string, unknown>;
  config: LayerConfig;
  tileJSON?: { tiles: string[]; minzoom: number; maxzoom: number };
}) => {
  const { styles, params_config } = config;
  const visibility = settings.visibility ?? true;

  const source = tileJSON
    ? {
        type: "vector",
        tiles: tileJSON.tiles,
        minzoom: tileJSON.minzoom,
        maxzoom: tileJSON.maxzoom,
      }
    : { type: "vector", url: `mapbox://${path}` };

  const c = parseConfig<Config>({
    config: {
      source,
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

export const DEFAULT_RASTER_CONFIG: LayerConfig = {
  styles: [{ type: "raster" }],
  params_config: [
    { key: "opacity", default: 1 },
    { key: "visibility", default: true },
  ],
  legend_config: { type: "basic", items: [] },
  colormap: {},
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
