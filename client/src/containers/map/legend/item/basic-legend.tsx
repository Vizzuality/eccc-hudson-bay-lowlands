import type { FC } from "react";
import { useApiTranslation } from "@/i18n/api-translation";
import type { LegendItem } from "@/types";

interface BasicLegendProps {
  items: LegendItem[];
}
const BasicLegend: FC<BasicLegendProps> = ({ items }) => {
  const { getTranslation } = useApiTranslation();

  if (items.length === 0) return null;

  return (
    <ul className="flex gap-1 flex-wrap">
      {items.map((item) => (
        <li
          key={`basic-legend-item-${item.value}-${item.color}`}
          className="flex items-center gap-2"
        >
          <div
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-2xs font-semibold">
            {getTranslation(item.label)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default BasicLegend;
