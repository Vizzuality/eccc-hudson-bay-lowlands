import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersBottomBar from "@/containers/data-layers/bottom-bar";
import CategorySelector from "@/containers/data-layers/category-selector";
import DataLayersList from "@/containers/data-layers/list";
import DataLayersSearch from "@/containers/data-layers/search";
import { useMainDatasets } from "@/containers/map-sidebar/main/use-main-datasets";
import { openDatasetIdsAtom } from "@/containers/tour/store";
import { useCategories } from "@/hooks/use-categories";

interface MainProps {
  header?: ReactNode;
}

const Main = ({ header }: MainProps) => {
  const { categoryItems, totalLayerCount, isCategoriesLoading } =
    useCategories();
  const { data: filteredDatasets, isFetching: isFilteredDatasetsLoading } =
    useMainDatasets();
  const t = useTranslations("map");
  const { layerIds, setLayerIds } = useLayerIds();
  const [openDatasetIds, setOpenDatasetIds] = useAtom(openDatasetIdsAtom);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-4 pb-12 max-lg:pb-32">
        {header ?? (
          <header className="min-w-0 px-6">
            <h1 className="text-4xl mb-5">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </header>
        )}
        <div data-tour="find-data" className="space-y-4">
          <DataLayersSearch />
          <CategorySelector
            items={categoryItems}
            isLoading={isCategoriesLoading}
            totalLayerCount={totalLayerCount}
          />
        </div>
        <DataLayersList
          datasets={filteredDatasets ?? []}
          isLoading={isFilteredDatasetsLoading}
          openItems={openDatasetIds}
          onOpenItemsChange={setOpenDatasetIds}
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
