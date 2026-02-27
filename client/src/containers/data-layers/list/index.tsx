import { useTranslations } from "next-intl";
import { type FC, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import DataLayersListItem from "@/containers/data-layers/list/item";
import DataLayersListItemDialog from "@/containers/data-layers/list/item-dialog";
import type { NormalizedDataset } from "@/types";

interface DataLayersListProps {
  datasets: NormalizedDataset[];
  onItemChange: (id: number, isSelected: boolean) => void;
}

const DataLayersList: FC<DataLayersListProps> = ({
  datasets,
  onItemChange,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("data-layers");
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
            onLearnMore={() => setDialogOpen(true)}
          />
        ))}
      </Accordion>
      <DataLayersListItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
};

export default DataLayersList;
