import type { FC } from "react";
import { cn } from "@/lib/utils";

interface ChartLegendProps {
  items: { label: string; value: number; fill: string }[];
  className?: string;
}
const ChartLegend: FC<ChartLegendProps> = ({ items, className }) => {
  return (
    <ul
      className={cn(
        "flex items-center justify-center gap-y-0.5 gap-x-2 flex-wrap text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => (
        <li
          key={`chart-legend-item-${item.label}-${item.value}`}
          className="flex items-center gap-1.5 w-fit"
        >
          <div
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.fill }}
          />
          <span className="text-2xs font-semibold leading-4">{item.label}</span>
        </li>
      ))}
    </ul>
  );
};

export default ChartLegend;
