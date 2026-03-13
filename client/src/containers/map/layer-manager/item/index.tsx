"use client";

import { useQuery } from "@tanstack/react-query";
import { useSyncLayersSettings } from "@/app/[locale]/url-store";
import RasterLayerManagerItem from "@/containers/map/layer-manager/item/raster-item";
import VectorLayerManagerItem from "@/containers/map/layer-manager/item/vector-item";
import { API } from "@/lib/api";
import { getLayerConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { LayerResponse } from "@/types";

interface LayerManagerItemProps {
  id: number;
  beforeId?: string;
}

const LayerManagerItem = ({ id, beforeId }: LayerManagerItemProps) => {
  const { layersSettings } = useSyncLayersSettings();
  const settings = layersSettings?.[id.toString()] || {};
  const { data: layer, isSuccess } = useQuery({
    queryKey: queryKeys.layers.byId(id).queryKey,
    queryFn: () => API<LayerResponse>(getLayerConfig(id)),
  });
  const format = layer?.format;
  if (!isSuccess) return null;

  if (format === "raster") {
    return (
      <RasterLayerManagerItem id={id} beforeId={beforeId} settings={settings} />
    );
  }

  if (format === "vector") {
    return (
      <VectorLayerManagerItem
        id={id}
        beforeId={beforeId}
        path={layer.path}
        config={layer.config}
        settings={settings}
      />
    );
  }

  return null;
};

export default LayerManagerItem;
