import { useLocale } from "next-intl";
import type { FC } from "react";

interface FeatureValueTooltipProps {
  properties: Record<string, unknown>;
}

const FeatureValueTooltip: FC<FeatureValueTooltipProps> = ({ properties }) => {
  const locale = useLocale();
  const suffix = `_${locale.toUpperCase()}`;
  const localizedKey = Object.keys(properties).find((k) => k.endsWith(suffix));
  const value = localizedKey
    ? properties[localizedKey]
    : Object.values(properties)[0];

  if (!value) return null;

  return <p className="text-sm font-semibold leading-5">{String(value)}</p>;
};

export default FeatureValueTooltip;
