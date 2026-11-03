import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { API } from "@/lib/api";
import { getLayerConfig, getLayersConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { LayerResponse, LayersResponse } from "@/types";

export function useLayerManager() {
  const { layerIds } = useLayerIds();
  const { data: layers, isSuccess } = useQuery({
    queryKey: queryKeys.layers.all.queryKey,
    queryFn: () => API<LayersResponse>(getLayersConfig),
    select: (data) => data.data,
  });

  const filteredLayers = useMemo(() => {
    if (!isSuccess) return [];
    return layers?.filter((layer) => layerIds.includes(layer.id));
  }, [layers, layerIds, isSuccess]);

  return {
    layers: filteredLayers,
  };
}

export function useAboveMaskLayerIds(): Set<string> {
  const { layerIds } = useLayerIds();
  const key = useQueries({
    queries: layerIds.map((id) => ({
      queryKey: queryKeys.layers.byId(id).queryKey,
      queryFn: () => API<LayerResponse>(getLayerConfig(id)),
    })),
    combine: (results) =>
      results
        .map((r) => r.data)
        .filter((layer) => layer?.config?.above_mask)
        .map((layer) => layer?.id)
        .join(","),
  });

  return useMemo(() => new Set(key ? key.split(",") : []), [key]);
}
