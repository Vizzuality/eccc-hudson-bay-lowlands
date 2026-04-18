import type { FC } from "react";
import ItemContainer from "@/containers/data-layers/list/item/item-container";
import ItemHeader from "@/containers/data-layers/list/item/item-header";

interface LayerItemProps {
  id: string;
  title: string;
  description: string;
}

const LayerItem: FC<LayerItemProps> = ({ id, title, description }) => {
  return (
    <ItemContainer>
      <ItemHeader id={id} title={title} description={description} />
    </ItemContainer>
  );
};

export default LayerItem;
