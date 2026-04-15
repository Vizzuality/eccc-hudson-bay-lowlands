import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { DEFAULT_MAX_ZOOM } from "@/containers/map/constants";
import { API } from "@/lib/api";
import { getLayersConfig, getTileJsonConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { LayersResponse, TileInfoResponse } from "@/types";

export function useLayerZoomConstraints() {
  const { layerIds } = useLayerIds();

  const { data: allLayers } = useQuery({
    queryKey: queryKeys.layers.all.queryKey,
    queryFn: () => API<LayersResponse>(getLayersConfig),
    select: (data) => data.data,
  });

  const rasterLayers = useMemo(() => {
    if (!allLayers) return [];
    return allLayers.filter(
      (layer) => layerIds.includes(layer.id) && layer.format === "raster",
    );
  }, [allLayers, layerIds]);

  const tileInfoQueries = useQueries({
    queries: rasterLayers.map((layer) => ({
      queryKey: queryKeys.cog.tileInfo(layer.path).queryKey,
      queryFn: () => API<TileInfoResponse>(getTileJsonConfig(layer.path)),
      enabled: !!layer.path,
    })),
  });

  const resolvedMaxZooms = tileInfoQueries
    .filter((q) => q.isSuccess && !!q.data)
    .map((q) => (q.data as TileInfoResponse).maxzoom);

  const maxZoom =
    resolvedMaxZooms.length > 0
      ? Math.max(...resolvedMaxZooms)
      : DEFAULT_MAX_ZOOM;

  return { maxZoom };
}
