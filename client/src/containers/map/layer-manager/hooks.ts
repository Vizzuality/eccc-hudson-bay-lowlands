import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { API } from "@/lib/api";
import { getLayersConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { LayersResponse } from "@/types";

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
