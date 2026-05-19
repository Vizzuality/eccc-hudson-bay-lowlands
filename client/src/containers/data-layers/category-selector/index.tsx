import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useCategory } from "@/app/[locale]/url-store";
import { getCategoryIcon } from "@/containers/data-layers/category-selector/utils";
import { CategorySelectorSkeleton } from "@/containers/skeletons";
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
  const t = useTranslations("data-layers.category-selector");
  const { category, setCategory } = useCategory();

  if (isLoading) {
    return <CategorySelectorSkeleton />;
  }

  return (
    <fieldset
      className="grid grid-cols-2 gap-2 px-6"
      aria-label={t("aria-label")}
    >
      <legend className="sr-only">{t("legend")}</legend>
      {[{ id: 0, name: t("all"), layerCount: totalLayerCount }, ...items].map(
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
                {t("data-layers-count", { count: c.layerCount })}
              </span>
            </label>
          );
        },
      )}
    </fieldset>
  );
};

export default CategorySelector;
