import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayers } from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersBottomBar from "@/containers/data-layers/bottom-bar";
import CategorySelector from "@/containers/data-layers/category-selector";
import DataLayersList from "@/containers/data-layers/list";
import DataLayersSearch from "@/containers/data-layers/search";
import { useApiTranslation } from "@/i18n/api-translation";
import { API, getCategoriesConfig, getDatasetsConfig } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CategoryResponse, DatasetResponse } from "@/types";

const Main = () => {
  const { getTranslation } = useApiTranslation();
  const { data: categories, isFetching: isCategoriesLoading } = useQuery({
    queryKey: queryKeys.categories.all.queryKey,
    queryFn: () => API<CategoryResponse>(getCategoriesConfig),
    select: (data) =>
      data.data.map((category) => ({
        id: category.id,
        name: getTranslation(category.metadata.title),
      })),
  });
  const { data: datasets, isFetching: isDatasetsLoading } = useQuery({
    queryKey: queryKeys.datasets.all.queryKey,
    queryFn: () => API<DatasetResponse>(getDatasetsConfig),
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
  const t = useTranslations("map");
  const { layers, setLayers } = useLayers();
  const handleItemChange = (id: number, isSelected: boolean) => {
    setLayers(
      isSelected ? [...layers, id] : layers.filter((layer) => layer !== id),
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 px-6">
        <header className="min-w-0">
          <h1 className="text-4xl mb-5">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>
        <DataLayersSearch />
        <CategorySelector
          items={categories ?? []}
          isLoading={isCategoriesLoading}
        />
        <DataLayersList
          datasets={datasets ?? []}
          onItemChange={handleItemChange}
          isLoading={isDatasetsLoading}
        />
        <DataLayersBottomBar
          activeDataCount={layers.length}
          onRemoveAll={() => setLayers([])}
        />
      </div>
    </ScrollArea>
  );
};

export default Main;
