import { useTranslations } from "next-intl";
import { type FC, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import DataLayersListItem from "@/containers/data-layers/list/item";
import DataLayersListItemDialog from "@/containers/data-layers/list/item-dialog";
import type { NormalizedDataset } from "@/types";

interface DataLayersListProps {
  datasets: NormalizedDataset[];
  isLoading: boolean;
  onItemChange: (id: number, isSelected: boolean) => void;
}

const DataLayersList: FC<DataLayersListProps> = ({
  datasets,
  isLoading,
  onItemChange,
}) => {
  const [dialogProps, setDialogProps] = useState<NormalizedDataset | null>(
    null,
  );
  const t = useTranslations("data-layers");

  if (isLoading) {
    return <DataLayersListSkeleton />;
  }

  return (
    <section aria-label="Data layers list">
      <p className="flex items-center gap-8 text-xs text-[rgba(26,37,61,0.66)] font-medium">
        <span className="shrink-0">
          {t("list.title", { count: datasets.length })}
        </span>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(26,37,61,0.10)_0%,rgba(69,99,163,0.10)_100%)]" />
      </p>
      <Accordion type="multiple">
        {datasets.map((item) => (
          <DataLayersListItem
            key={`dataset-item-${item.id}`}
            id={item.id}
            title={item.metadata.title}
            description={item.metadata.description}
            layers={item.layers ?? []}
            onChange={(id, isSelected) => onItemChange(id, isSelected)}
            onLearnMore={() => setDialogProps(item)}
          />
        ))}
      </Accordion>
      <DataLayersListItemDialog
        open={!!dialogProps}
        onOpenChange={() => setDialogProps(null)}
        dataset={dialogProps}
      />
    </section>
  );
};

const DataLayersListSkeleton = () => {
  return (
    <section aria-label="Data layers list skeleton" className="space-y-5">
      <Skeleton className="h-3 w-16" />
      <div className="space-y-2">
        {[...Array(6).keys()].map((num) => (
          <div
            key={`data-layers-list-skeleton-${num}`}
            className="space-y-5 h-24"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default DataLayersList;
