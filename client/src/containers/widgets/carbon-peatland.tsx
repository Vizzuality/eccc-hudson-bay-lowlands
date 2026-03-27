import { AtomIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type { PeatCarbonStats } from "@/containers/analysis/types";
import VerticalBarChart from "@/containers/charts/vertical-bar-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

interface CarbonPeatlandProps extends WidgetCardBaseProps {
  stats: PeatCarbonStats;
}

const CarbonPeatland: FC<CarbonPeatlandProps> = ({ id, stats }) => {
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
        title="Histogram of peat depth"
        chartConfig={{
          y: {
            label: "Frequency",
            color: "var(--color-amber-600)",
          },
        }}
        data={[
          { x: "0", y: 42 },
          { x: "50", y: 128 },
          { x: "100", y: 256 },
          { x: "150", y: 312 },
          { x: "200", y: 198 },
          { x: "250", y: 104 },
          { x: "300", y: 38 },
          { x: "350", y: 12 },
        ]}
      />
      <VerticalBarChart
        title="Carbon Density"
        chartConfig={{
          y: {
            label: "Carbon Density",
            color: "var(--color-yellow-500)",
          },
        }}
        data={[
          { x: "0", y: 42 },
          { x: "50", y: 128 },
          { x: "100", y: 256 },
          { x: "150", y: 312 },
          { x: "200", y: 198 },
          { x: "250", y: 104 },
          { x: "300", y: 38 },
          { x: "350", y: 12 },
        ]}
      />
    </WidgetCard>
  );
};

export default CarbonPeatland;
