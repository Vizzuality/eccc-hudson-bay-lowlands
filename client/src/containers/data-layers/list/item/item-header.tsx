import { PlusIcon, XIcon } from "lucide-react";
import { type FC, useCallback } from "react";
import { useLayerIds } from "@/app/[locale]/url-store";
import { cn } from "@/lib/utils";

interface ItemHeaderProps {
  id: number;
  title: string;
  description: string;
}
const ItemHeader: FC<ItemHeaderProps> = ({ id, title, description }) => {
  const { layerIds, setLayerIds } = useLayerIds();
  const isSelected = layerIds.includes(id);
  const handleItemChange = useCallback(
    (isSelected: boolean) => {
      setLayerIds(
        isSelected
          ? [...layerIds, id]
          : layerIds.filter((layerId) => layerId !== id),
      );
    },
    [layerIds, id, setLayerIds],
  );

  return (
    <header>
      <label
        htmlFor={id.toString()}
        className={cn({
          "absolute right-5 top-0 translate-y-1/2 z-10": true,
          "size-8 rounded-full flex items-center justify-center hover:bg-secondary group-hover:text-accent cursor-pointer": true,
          "bg-primary text-primary-foreground group-hover:bg-primary hover:bg-primary":
            isSelected,
        })}
      >
        <input
          type="checkbox"
          id={id.toString()}
          className="sr-only"
          aria-label={title}
          checked={isSelected}
          onChange={() => handleItemChange(!isSelected)}
        />
        {isSelected ? (
          <XIcon className="size-4" aria-hidden />
        ) : (
          <PlusIcon className="size-4" aria-hidden />
        )}
      </label>
      <div className="px-5 pt-5 pb-4 space-y-2 group-hover:translate-x-2">
        <h2 className="text-sm font-semibold">{title}</h2>

        <p className="text-xs text-muted-foreground font-medium pr-5">
          {description}
        </p>
      </div>
    </header>
  );
};

export default ItemHeader;
