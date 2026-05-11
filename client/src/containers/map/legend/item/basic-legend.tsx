import type { FC } from "react";
import { useApiTranslation } from "@/i18n/api-translation";
import type { LegendItem } from "@/types";

function LegendSwatch({ item }: { item: LegendItem }) {
  const color = item.color ?? item["fill-color"] ?? "transparent";

  if (item["line-width"]) {
    const dashArray = item["line-dasharray"];
    return (
      <svg width="16" height="10" className="shrink-0" aria-hidden="true">
        <line
          x1="0"
          y1="5"
          x2="16"
          y2="5"
          stroke={color}
          strokeWidth={item["line-width"]}
          {...(dashArray && { strokeDasharray: dashArray.join(" ") })}
        />
      </svg>
    );
  }

  return (
    <div
      className="size-2.5 shrink-0 rounded-full"
      style={{
        backgroundColor: color,
        ...(item["fill-outline-color"] && {
          border: `1px solid ${item["fill-outline-color"]}`,
        }),
      }}
    />
  );
}

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
          <LegendSwatch item={item} />
          <span className="text-2xs font-semibold">
            {getTranslation(item.label)}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default BasicLegend;
