import { useQuery } from "@tanstack/react-query";

import { useApiTranslation } from "@/i18n/api-translation";
import { API } from "@/lib/api";
import { getDatasetsConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { DatasetFilters } from "@/lib/schema";
import type { DatasetResponse } from "@/types";

export function useTranslatedDatasets(filters?: DatasetFilters) {
  const { getTranslation } = useApiTranslation();

  return useQuery({
    queryKey: queryKeys.datasets.all(filters).queryKey,
    queryFn: () => API<DatasetResponse>(getDatasetsConfig(filters)),
    select: (data) =>
      data.data.map((dataset) => ({
        ...dataset,
        metadata: {
          title: getTranslation(dataset.metadata.title),
          description: getTranslation(dataset.metadata.description),
          source: getTranslation(dataset.metadata.source),
          citation: getTranslation(dataset.metadata.citation),
        },
      })),
  });
}
