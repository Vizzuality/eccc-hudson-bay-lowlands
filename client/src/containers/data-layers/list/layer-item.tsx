import { PlusIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface LayerItemProps {
  id: number;
  title: string;
  description: string;
  isSelected: boolean;
  onChange: (id: number, isSelected: boolean) => void;
}

const LayerItem: FC<LayerItemProps> = ({
  id,
  title,
  description,
  isSelected,
  onChange,
}) => {
  return (
    <article className="relative group block **:transition-all **:duration-200 **:ease-out">
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
          onChange={() => onChange(id, !isSelected)}
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
      <div className="px-5">
        <Separator className="bg-linear-to-r from-secondary/30 to-primary/20 group-hover:bg-[linear-gradient(90deg,rgba(230,244,241,0.30)_0%,#10B981_100%)]" />
      </div>
    </article>
  );
};

export default LayerItem;
