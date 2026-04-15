"use client";

import type { RasterSourceSpecification } from "mapbox-gl";
import { useQuery } from "@tanstack/react-query";
import { Layer as RMLayer, Source as RMSource } from "react-map-gl/mapbox";
import {
  applyHighDpiToRasterSource,
  getRasterLayerConfig,
} from "@/containers/map/layer-manager/item/utils";
import { API } from "@/lib/api";
import { getLayerConfig, getTileJsonConfig } from "@/lib/api/config";
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

  if (!isLayerSuccess || !isTileInfoSuccess || !layer.config) return null;

  const withColormap = !!layer.config.colormap;

  const { source: rawSource, styles } = getRasterLayerConfig({
    path,
    settings,
    tileInfo,
    config: layer.config,
    withColormap,
    layerType: layer.type,
  });

  const source = applyHighDpiToRasterSource(
    rawSource as RasterSourceSpecification,
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
  );

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
