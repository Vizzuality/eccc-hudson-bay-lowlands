import { useTranslations } from "next-intl";
import { useDataLayersSearch, useLayerIds } from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersBottomBar from "@/containers/data-layers/bottom-bar";
import CategorySelector from "@/containers/data-layers/category-selector";
import DataLayersList from "@/containers/data-layers/list";
import DataLayersSearch from "@/containers/data-layers/search";
import { useCategories } from "@/hooks/use-categories";
import { useTranslatedDatasets } from "@/hooks/use-datasets";

const Main = () => {
  const { dataLayersSearch } = useDataLayersSearch();
  const { categoryItems, totalLayerCount, isCategoriesLoading, category } =
    useCategories();
  const { data: filteredDatasets, isFetching: isFilteredDatasetsLoading } =
    useTranslatedDatasets({
      include_layers: true,
      limit: 99,
      category_id: category ?? undefined,
      search: dataLayersSearch ?? undefined,
    });
  const t = useTranslations("map");
  const { layerIds, setLayerIds } = useLayerIds();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 px-6">
        <header className="min-w-0">
          <h1 className="text-4xl mb-5">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </header>
        <DataLayersSearch />
        <CategorySelector
          items={categoryItems}
          isLoading={isCategoriesLoading}
          totalLayerCount={totalLayerCount}
        />
        <DataLayersList
          datasets={filteredDatasets ?? []}
          isLoading={isFilteredDatasetsLoading}
        />
        <DataLayersBottomBar
          activeDataCount={layerIds.length}
          onRemoveAll={() => setLayerIds([])}
        />
      </div>
    </ScrollArea>
  );
};

export default Main;
