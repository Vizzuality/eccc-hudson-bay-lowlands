import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type {
  CategoricalDataPoint,
  FloodSusceptibilityStats,
} from "@/containers/analysis/types";
import DonutChart from "@/containers/charts/donut-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import WidgetIcon from "@/containers/widgets/icon";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import type { Layer } from "@/types";

interface FloodSusceptibilityProps extends WidgetCardBaseProps {
  stats: FloodSusceptibilityStats;
  chart: Record<string, CategoricalDataPoint[]>;
  layers: Layer[];
  onInfoButtonClick: () => void;
}

const FloodSusceptibility: FC<FloodSusceptibilityProps> = ({
  id,
  stats,
  chart,
  layers,
  onInfoButtonClick,
}) => {
  const t = useTranslations("widgets.flood_susceptibility");
  const data = Object.values(chart)
    .flat()
    .map((item) => ({
      key: item.key,
      label: t(`chart.${item.key}`),
      value: item.value,
      fill: `var(--color-${item.key})`,
    }));

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      icon={
        <WidgetCardIcon
          icon={<WidgetIcon id={id} className="size-5 text-red-500" />}
          backgroundColor="#EF4444"
        />
      }
      layers={layers}
      onInfoButtonClick={onInfoButtonClick}
      onAddToMapButtonClick={() => {}}
    >
      <div className="flex flex-col gap-4 min-[1440px]:flex-row">
        <DonutChart
          className="flex flex-col items-center self-center min-[1440px]:self-auto"
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
