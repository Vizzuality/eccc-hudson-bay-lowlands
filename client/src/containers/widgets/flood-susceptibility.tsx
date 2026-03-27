import { WavesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type { FloodSusceptibilityStats } from "@/containers/analysis/types";
import DonutChart from "@/containers/charts/donut-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import { useApiTranslation } from "@/i18n/api-translation";

const mockData = [
  {
    key: "fsi_low_perc",
    label: { en: "Low risk", fr: "Faible risque" },
    value: 50,
  },
  {
    key: "fsi_moderate_perc",
    label: { en: "Moderate risk", fr: "Modéré risque" },
    value: 30,
  },
  {
    key: "fsi_high_perc",
    label: { en: "High risk", fr: "Haut risque" },
    value: 50,
  },
];

interface FloodSusceptibilityProps extends WidgetCardBaseProps {
  stats: FloodSusceptibilityStats;
}

const FloodSusceptibility: FC<FloodSusceptibilityProps> = ({ id, stats }) => {
  const t = useTranslations("widgets.flood_susceptibility");
  const { getTranslation } = useApiTranslation();
  const data = mockData.map((item) => ({
    key: item.key,
    label: getTranslation(item.label),
    value: item.value,
    fill: `var(--color-${item.key})`,
  }));

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      icon={
        <WidgetCardIcon
          icon={<WavesIcon className="size-5 text-red-500" />}
          backgroundColor="#EF4444"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <div className="flex gap-4">
        <DonutChart
          data={data}
          chartConfig={{
            fsi_low_perc: {
              color: "var(--color-emerald-500)",
            },
            fsi_moderate_perc: {
              color: "var(--color-orange-400)",
            },
            fsi_high_perc: {
              color: "var(--color-red-600)",
            },
          }}
        />
        <div className="space-y-3">
          <RichText className="text-muted-foreground text-sm font-medium leading-5">
            {(tags) =>
              t.rich("description", {
                ...tags,
                ...stats,
              })
            }
          </RichText>
          <MoreInfoTooltip title={t("more-info.title")}>
            {t("more-info.description")}
          </MoreInfoTooltip>
        </div>
      </div>
    </WidgetCard>
  );
};

export default FloodSusceptibility;
