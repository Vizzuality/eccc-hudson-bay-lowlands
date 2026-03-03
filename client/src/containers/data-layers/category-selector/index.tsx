import type { FC } from "react";
import { useCategory } from "@/app/[locale]/url-store";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryIcon } from "@/containers/data-layers/category-selector/utils";
import { cn } from "@/lib/utils";
import type { CategorySelectorItem } from "@/types";

interface CategorySelectorProps {
  items: CategorySelectorItem[];
  isLoading: boolean;
  totalLayerCount: number;
}

const CategorySelector: FC<CategorySelectorProps> = ({
  items,
  isLoading,
  totalLayerCount,
}) => {
  const { category, setCategory } = useCategory();

  if (isLoading) {
    return <CategorySelectorSkeleton />;
  }

  return (
    <fieldset className="grid grid-cols-2 gap-2" aria-label="Category filter">
      <legend className="sr-only">Select a category</legend>
      {[{ id: 0, name: "All", layerCount: totalLayerCount }, ...items].map(
        (c) => {
          const isActive =
            category === c.id || (category === null && c.id === 0);
          const key = `category-selector-${c.id}`;
          const Icon = getCategoryIcon(c.id);

          return (
            <label
              key={key}
              htmlFor={key}
              className={cn({
                "bg-white/80 rounded-4xl p-6 cursor-pointer flex flex-col gap-2 shadow-lg transition-all": true,
                "border border-transparent select-none": true,
                "hover:bg-[linear-gradient(270deg,var(--accent)_0%,rgba(15,23,43,0)_100%)] hover:bg-blend-color-burn hover:border-accent":
                  !isActive,
                "has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2": true,
                "bg-primary hover:bg-[linear-gradient(270deg,var(--accent)_0%,rgba(15,23,43,0)_100%)] bg-clip-padding":
                  isActive,
              })}
            >
              {!!Icon && <Icon className={cn({ "text-accent": isActive })} />}
              <input
                type="radio"
                name="category"
                value={c.id}
                id={key}
                checked={isActive}
                onChange={() => setCategory(c.id || null)}
                className="sr-only"
              />
              <span
                className={cn({
                  "relative text-sm font-medium": true,
                  "text-primary-foreground": isActive,
                })}
              >
                {c.name}
              </span>
              <span className="relative text-xs text-muted-foreground font-semibold">
                {c.layerCount} data layers
              </span>
            </label>
          );
        },
      )}
    </fieldset>
  );
};

const CategorySelectorSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[...Array(4).keys()].map((num) => (
        <div
          key={`category-selector-skeleton-${num}`}
          className="bg-white/80 rounded-4xl p-6 space-y-2"
        >
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <Skeleton className="w-2/3 h-2.5" />
          <Skeleton className="w-1/2 h-2" />
        </div>
      ))}
    </div>
  );
};

export default CategorySelector;
