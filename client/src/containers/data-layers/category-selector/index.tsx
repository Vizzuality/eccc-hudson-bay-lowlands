import { useCategory } from "@/app/[locale]/url-store";
import { CATEGORIES } from "@/containers/data-layers/constants";
import { cn } from "@/lib/utils";

const CategorySelector = () => {
  const { category, setCategory } = useCategory();
  return (
    <fieldset className="grid grid-cols-2 gap-2" aria-label="Category filter">
      <legend className="sr-only">Select a category</legend>
      {CATEGORIES.map((c) => {
        const isActive = category === c.id;
        return (
          <label
            key={c.id}
            htmlFor={c.id}
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
            <input
              type="radio"
              name="category"
              value={c.id}
              id={c.id}
              checked={isActive}
              onChange={() => setCategory(c.id)}
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
              5 data layers
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default CategorySelector;
