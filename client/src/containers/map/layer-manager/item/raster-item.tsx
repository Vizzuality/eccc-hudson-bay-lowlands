"use client";

import { useQuery } from "@tanstack/react-query";
import {
  type LayerProps,
  Layer as RMLayer,
  Source as RMSource,
  type SourceProps,
} from "react-map-gl/mapbox";
import { env } from "@/env";
import { API } from "@/lib/api";
import { getLayerConfig, getTileJsonConfig } from "@/lib/api/config";
import { type Config, parseConfig } from "@/lib/json-converter";
import { queryKeys } from "@/lib/query-keys";
import type { LayerResponse, TileInfoResponse } from "@/types";

interface RasterLayerManagerItemProps {
  id: number;
  settings: Record<string, unknown>;
  beforeId?: string;
}

const RasterLayerManagerItem = ({
  id,
  beforeId,
  settings,
}: RasterLayerManagerItemProps) => {
  const { data: layer, isSuccess: isLayerSuccess } = useQuery({
    queryKey: queryKeys.layers.byId(id).queryKey,
    queryFn: () => API<LayerResponse>(getLayerConfig(id)),
  });
  const path = layer?.path ?? "";
  const { data: tileInfo, isSuccess: isTileInfoSuccess } = useQuery({
    queryKey: queryKeys.cog.tileInfo(path).queryKey,
    queryFn: () => API<TileInfoResponse>(getTileJsonConfig(path)),
    enabled: isLayerSuccess && !!path,
  });
  const visibility = settings.visibility ?? true;

  if (!isLayerSuccess || !isTileInfoSuccess) return null;

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

  return (
    <RMSource id={`${id}-source`} key={`${id}-source`} {...source}>
      {styles.map((style) => (
        <RMLayer
          key={`${id}-layer`}
          id={id.toString()}
          beforeId={beforeId}
          {...style}
        />
      ))}
    </RMSource>
  );
};

export default RasterLayerManagerItem;
