import type { FC } from "react";
import { useApiTranslation } from "@/i18n/api-translation";
import type { LegendItem } from "@/types";

interface GradientLegendProps {
  items: LegendItem[];
}
const GradientLegend: FC<GradientLegendProps> = ({ items }) => {
  const { getTranslation } = useApiTranslation();
  return (
    <div className="flex justify-start gap-y-1 flex-wrap">
      <div
        className="h-3 w-full"
        style={{
          background: `linear-gradient(to right, ${items.map((i) => i.color).join(", ")})`,
        }}
      />

      <div className="flex justify-between w-full">
        {items.map((item) => (
          <span
            key={`gradient-legend-item-${item.value}-${item.color}`}
            className="text-2xs font-medium"
          >
            {getTranslation(item.label)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GradientLegend;
