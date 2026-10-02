import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import MapLayout from "@/containers/map-layout";
import MapSidebar from "@/containers/map-sidebar";
import { API } from "@/lib/api";
import { getCategoriesConfig, getDatasetsConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { CategoryResponse, DatasetResponse } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });

  return {
    title: t("title"),
    description: t("description"),
  };
}
export default async function Home({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { category, dataLayersSearch } = await searchParams;
  const categoryParam = Array.isArray(category) ? category[0] : category;
  const dataLayersSearchParam = Array.isArray(dataLayersSearch)
    ? dataLayersSearch[0]
    : dataLayersSearch;
  const categoryId =
    typeof categoryParam === "string"
      ? Number.parseInt(categoryParam, 10)
      : undefined;
  const queryParams = {
    include_layers: true,
    limit: 99,
    ...(typeof categoryId === "number" && Number.isFinite(categoryId)
      ? { category_id: categoryId }
      : {}),
    ...(typeof dataLayersSearchParam === "string"
      ? { search: dataLayersSearchParam }
      : {}),
  };
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.categories.all.queryKey,
    queryFn: () => API<CategoryResponse>(getCategoriesConfig),
  });
  await queryClient.prefetchQuery({
    queryKey: queryKeys.datasets.all(queryParams).queryKey,
    queryFn: () => API<DatasetResponse>(getDatasetsConfig(queryParams)),
  });
  await queryClient.prefetchQuery({
    queryKey: queryKeys.datasets.all({ include_layers: true, limit: 99 })
      .queryKey,
    queryFn: () =>
      API<DatasetResponse>(getDatasetsConfig({ include_layers: true })),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapLayout
        sidebar={
          <Suspense>
            <MapSidebar />
          </Suspense>
        }
      />
    </HydrationBoundary>
  );
}
