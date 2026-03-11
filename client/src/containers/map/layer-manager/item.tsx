"use client";

import { useQuery } from "@tanstack/react-query";
import { Layer as RMLayer, Source as RMSource } from "react-map-gl/mapbox";
import { env } from "@/env";
import { API } from "@/lib/api";
import { getLayerConfig, getTileJsonConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { LayerResponse, TileInfoResponse } from "@/types";

interface LayerManagerItemProps {
  id: number;
  beforeId?: string;
}

const LayerManagerItem = ({ id, beforeId }: LayerManagerItemProps) => {
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

  if (!isLayerSuccess || !isTileInfoSuccess) return null;

  return (
    <RMSource
      type="raster"
      id={`${id}-source`}
      key={`${id}-source`}
      tiles={[
        env.NEXT_PUBLIC_API_URL +
          `/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodeURIComponent(path)}&colormap_name=viridis`,
      ]}
      minzoom={tileInfo.minzoom}
      maxzoom={tileInfo.maxzoom}
      bounds={tileInfo.bounds}
    >
      <RMLayer
        type="raster"
        key={`${id}-layer`}
        id={id.toString()}
        beforeId={beforeId}
      />
    </RMSource>
  );
};

export default LayerManagerItem;
