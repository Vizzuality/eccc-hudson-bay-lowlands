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
  return (
    <section aria-label="Data layers list">
      <p>All data ({items.length})</p>
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
