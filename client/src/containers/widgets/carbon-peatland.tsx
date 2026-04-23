import { AtomIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type {
  PeatCarbonStats,
  TimeSeriesDataPoint,
} from "@/containers/analysis/types";
import VerticalBarChart from "@/containers/charts/vertical-bar-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

interface CarbonPeatlandProps extends WidgetCardBaseProps {
  stats: PeatCarbonStats;
  chart: Record<string, TimeSeriesDataPoint[]>;
}

const CarbonPeatland: FC<CarbonPeatlandProps> = ({ id, stats, chart }) => {
  const t = useTranslations("widgets.peat_carbon");

  return (
    <WidgetCard
      id={id}
      className="space-y-4"
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              ...stats,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<AtomIcon className="size-5 text-yellow-600" />}
          backgroundColor="#CA8A04"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <VerticalBarChart
        title={t("chart-peat-depth")}
        chartConfig={{
          y: {
            label: t("chart-peat-depth-label"),
            color: "var(--color-amber-600)",
          },
        }}
        data={(chart.peat_cog ?? []).map((p) => ({
          x: String(p.x),
          y: p.y,
        }))}
      />
      <VerticalBarChart
        title={t("chart-carbon-density")}
        chartConfig={{
          y: {
            label: t("chart-carbon-density-label"),
            color: "var(--color-yellow-500)",
          },
        }}
        data={(chart.carbon_cog ?? []).map((p) => ({
          x: String(p.x),
          y: p.y,
        }))}
      />
    </WidgetCard>
  );
};

export default CarbonPeatland;
