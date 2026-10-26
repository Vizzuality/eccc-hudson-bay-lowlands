import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import type { FC } from "react";
import { useApiTranslation } from "@/i18n/api-translation";
import { API } from "@/lib/api";
import { getCogPointConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { CogPointResponse, LayerCategory, LegendItem } from "@/types";

interface RasterPointTooltipProps {
  path: string;
  unit: string;
  categories: LayerCategory[] | null;
  legendItems: LegendItem[] | null;
  longitude: number;
  latitude: number;
}

const RasterPointTooltip: FC<RasterPointTooltipProps> = ({
  path,
  unit,
  categories,
  legendItems,
  longitude,
  latitude,
}) => {
  const t = useTranslations("map.popup-raster");
  const format = useFormatter();
  const { getTranslation } = useApiTranslation();

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.cog.point(path, longitude, latitude).queryKey,
    queryFn: () =>
      API<CogPointResponse>(getCogPointConfig(path, longitude, latitude)),
    retry: false,
  });

  const value = data?.values[0] ?? null;
  const category = categories?.find((c) => c.value === value);
  const label = category ? getTranslation(category.label) : null;
  const color = label
    ? legendItems?.find((item) => getTranslation(item.label) === label)?.color
    : null;

  return (
    <p
      aria-live="polite"
      className="flex items-center gap-1.5 text-sm font-semibold leading-5"
    >
      {isPending && (
        <span className="text-muted-foreground">{t("loading")}</span>
      )}
      {!isPending && (isError || value === null) && (
        <span className="text-muted-foreground">{t("no-data")}</span>
      )}
      {color && (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      {value !== null &&
        (label ??
          `${format.number(value, { maximumFractionDigits: 2 })} ${unit}`)}
    </p>
  );
};

export default RasterPointTooltip;
