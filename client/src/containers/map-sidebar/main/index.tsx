import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLayers } from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersBottomBar from "@/containers/data-layers/bottom-bar";
import CategorySelector from "@/containers/data-layers/category-selector";
import DataLayersList from "@/containers/data-layers/list";
import DataLayersSearch from "@/containers/data-layers/search";
import { useApiTranslation } from "@/i18n/api-translation";
import API from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CategoryResponse, DataLayer } from "@/types";

const mockItems: DataLayer[] = Array.from({ length: 20 }, (_, index) => ({
  id: index.toString(),
  title: `Layer ${index + 1}`,
  description: `Description ${index + 1}`,
}));

const Main = () => {
  const { getTranslation } = useApiTranslation();
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all.queryKey,
    queryFn: () => API<CategoryResponse>({ url: "/categories" }),
    select: (data) =>
      data.data.map((category) => ({
        id: category.id,
        name: getTranslation(category.metadata.title),
      })),
  });
  const t = useTranslations("map");
  const { layers, setLayers } = useLayers();
  const handleItemChange = (id: string, isSelected: boolean) => {
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
        <CategorySelector items={categories ?? []} />
        <DataLayersList
          items={mockItems}
          layers={layers}
          onItemChange={handleItemChange}
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
