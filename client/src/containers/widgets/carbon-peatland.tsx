import { AtomIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import VerticalBarChart from "@/containers/charts/vertical-bar-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const CarbonPeatland: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.carbon-peatlands");

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
              peat_depth_avg: 242,
              peat_depth_max: 680,
              carbon_total: 48.2,
              carbon_density: 38.7,
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
