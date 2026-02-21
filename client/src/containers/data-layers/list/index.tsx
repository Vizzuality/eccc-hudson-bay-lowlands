import { useTranslations } from "next-intl";
import { type FC, useState } from "react";
import DataLayersListItem from "@/containers/data-layers/list/item";
import DataLayersListItemDialog from "@/containers/data-layers/list/item-dialog";
import type { DataLayer } from "@/types";

interface DataLayersListProps {
  items: DataLayer[];
  layers: string[];
  onItemChange: (id: string, isSelected: boolean) => void;
}

const DataLayersList: FC<DataLayersListProps> = ({
  items,
  layers,
  onItemChange,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("data-layers");
  return (
    <section aria-label="Data layers list">
      <p className="flex items-center gap-8 text-xs text-[rgba(26,37,61,0.66)] font-medium">
        <span className="shrink-0">
          {t("list.title", { count: items.length })}
        </span>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(26,37,61,0.10)_0%,rgba(69,99,163,0.10)_100%)]" />
      </p>
      {items.map((item) => (
        <DataLayersListItem
          key={item.id}
          {...item}
          isSelected={layers.includes(item.id)}
          onChange={(id, isSelected) => onItemChange(id, isSelected)}
          onLearnMore={() => setDialogOpen(true)}
        />
      ))}
      <DataLayersListItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
};

export default DataLayersList;
