import { useQuery } from "@tanstack/react-query";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import { API } from "@/lib/api";
import { getHblAreaConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import { invertPolygon } from "@/lib/utils/invert-polygon";

type HblAreaResponse = Feature<Polygon | MultiPolygon>;

export function useHblArea() {
  return useQuery({
    queryKey: queryKeys.hblArea.all.queryKey,
    queryFn: () => API<HblAreaResponse>(getHblAreaConfig),
    staleTime: Number.POSITIVE_INFINITY,
    select: invertPolygon,
    structuralSharing: false,
  });
}
