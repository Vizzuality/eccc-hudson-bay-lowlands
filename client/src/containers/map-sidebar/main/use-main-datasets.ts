import { useDataLayersSearch } from "@/app/[locale]/url-store";
import { useCategories } from "@/hooks/use-categories";
import { useTranslatedDatasets } from "@/hooks/use-datasets";

export function useMainDatasets() {
  const { dataLayersSearch } = useDataLayersSearch();
  const { category } = useCategories();
  return useTranslatedDatasets({
    include_layers: true,
    limit: 99,
    category_id: category ?? undefined,
    search: dataLayersSearch ?? undefined,
  });
}
