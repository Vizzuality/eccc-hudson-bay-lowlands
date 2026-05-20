import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import { API } from "@/lib/api";
import { getHblAreaConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import { invertPolygon } from "@/lib/utils/invert-polygon";

type HblAreaResponse = Feature<Polygon | MultiPolygon>;

const hblAreaQueryOptions = queryOptions({
  queryKey: queryKeys.hblArea.all.queryKey,
  queryFn: () => API<HblAreaResponse>(getHblAreaConfig),
  staleTime: Number.POSITIVE_INFINITY,
});

export function useHblArea() {
  return useQuery({
    ...hblAreaQueryOptions,
    select: invertPolygon,
    structuralSharing: false,
  });
}

export function useHblAreaRaw() {
  return useQuery(hblAreaQueryOptions);
}
