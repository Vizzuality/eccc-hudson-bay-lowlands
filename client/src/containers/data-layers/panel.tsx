"use client";

import { useMapAnalysis } from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersList from "@/containers/data-layers/list";
import { useTranslatedDatasets } from "@/hooks/use-datasets";
import { cn } from "@/lib/utils";

const DataLayersPanel = () => {
  const { datasets } = useMapAnalysis();
  const { data: allDatasets, isFetching: isDatasetsLoading } =
    useTranslatedDatasets({
      include_layers: true,
      limit: 99,
    });

  return (
    <div
      className={cn(
        "h-full min-h-0 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
        datasets ? "w-[350px] opacity-100" : "w-0 opacity-0",
      )}
    >
      <ScrollArea className="h-full w-full pt-6 border-l border-l-secondary">
        <DataLayersList
          datasets={allDatasets ?? []}
          isLoading={isDatasetsLoading}
          className="pb-6"
        />
      </ScrollArea>
    </div>
  );
};

export default DataLayersPanel;
