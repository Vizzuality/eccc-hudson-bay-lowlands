import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useCategory } from "@/app/[locale]/url-store";
import { useApiTranslation } from "@/i18n/api-translation";
import { API } from "@/lib/api";
import { getCategoriesConfig, getDatasetsConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type {
  CategoryResponse,
  CategorySelectorItem,
  Dataset,
  DatasetResponse,
  NormalizedCategory,
} from "@/types";

export function buildCategoryItems(
  categories: NormalizedCategory[] | undefined,
  datasets: Dataset[] | undefined,
): { categoryItems: CategorySelectorItem[]; totalLayerCount: number } {
  if (!categories) {
    return { categoryItems: [], totalLayerCount: 0 };
  }

  const layerCountByCategoryId = new Map<number, number>();
  let total = 0;

  (datasets ?? []).forEach((dataset) => {
    const count = dataset.layers?.length ?? 0;
    if (count === 0) return;

    total += count;
    const current = layerCountByCategoryId.get(dataset.category_id) ?? 0;
    layerCountByCategoryId.set(dataset.category_id, current + count);
  });

  return {
    categoryItems: categories.map((cat) => ({
      ...cat,
      layerCount: layerCountByCategoryId.get(cat.id) ?? 0,
    })),
    totalLayerCount: total,
  };
}

export function useCategories() {
  const { getTranslation } = useApiTranslation();
  const { category } = useCategory();

  const { data: categories, isFetching: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.categories.all.queryKey,
    queryFn: () => API<CategoryResponse>(getCategoriesConfig),
    select: (data) =>
      data.data.map((cat) => ({
        id: cat.id,
        name: getTranslation(cat.metadata.title),
      })),
  });

  const { data: allDatasets } = useQuery({
    queryKey: queryKeys.datasets.all({ include_layers: true, limit: 99 })
      .queryKey,
    queryFn: () =>
      API<DatasetResponse>(
        getDatasetsConfig({ include_layers: true, limit: 99 }),
      ),
    select: (data) => data.data,
  });

  const { categoryItems, totalLayerCount } = useMemo(
    () => buildCategoryItems(categories, allDatasets),
    [categories, allDatasets],
  );

  return { categoryItems, totalLayerCount, isCategoriesLoading, category };
}
