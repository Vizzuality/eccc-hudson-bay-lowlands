import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type React from "react";
import { cloneElement, isValidElement } from "react";
import type { SortableItemProps } from "@/containers/map/legend/types";
import { cn } from "@/lib/utils";

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  sortable,
  children,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    setNodeRef,
  } = useSortable({
    id,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  if (!isValidElement(children)) {
    throw new Error("SortableItem requires a valid React element as a child.");
  }

  const CHILD = cloneElement(children, {
    // @ts-expect-error No idea why this is not working
    sortable,
    listeners,
    attributes,
    isDragging,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn({
        "w-full": true,
        "opacity-0": isDragging,
      })}
      style={style}
      {...(!sortable.handle && {
        ...listeners,
        ...attributes,
      })}
    >
      {CHILD}
    </div>
  );
};

export default SortableItem;
