import { useLocale } from "next-intl";
import type { FC } from "react";
import type { LegendItem } from "@/types";

interface FeatureValueTooltipProps {
  properties: Record<string, unknown>;
  legendItems: LegendItem[] | null;
}

const FeatureValueTooltip: FC<FeatureValueTooltipProps> = ({
  properties,
  legendItems,
}) => {
  const locale = useLocale();
  const suffix = `_${locale.toUpperCase()}`;
  const localizedKey = Object.keys(properties).find((k) => k.endsWith(suffix));
  const value = localizedKey
    ? properties[localizedKey]
    : Object.values(properties)[0];

  if (!value) return null;

  const valueStr = String(value);
  const matchedItem = legendItems?.find(
    (item) => item.label[locale] === valueStr,
  );
  const color = matchedItem?.color ?? matchedItem?.["fill-color"];

  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold leading-5">
      {color && (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      {valueStr}
    </p>
  );
};

export default FeatureValueTooltip;
