import { SnowflakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type { SnowDynamicsStats } from "@/containers/analysis/types";
import LineChart from "@/containers/charts/line-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const mockData = [
  { x: "2021", y: 10 },
  { x: "2022", y: 14 },
  { x: "2023", y: 18 },
  { x: "2024", y: 22 },
  { x: "2025", y: 26 },
  { x: "2027", y: 30 },
  { x: "2028", y: 34 },
  { x: "2029", y: 38 },
  { x: "2030", y: 42 },
];

const chartConfig = {
  y: {
    label: "Mean Snow Duration per Winter (days)",
    color: "var(--color-indigo-700)",
  },
};

const Description = ({ stats }: { stats: SnowDynamicsStats }) => {
  const t = useTranslations("widgets.snow_dynamics");
  return (
    <RichText>
      {(tags) =>
        t.rich("description", {
          ...tags,
          ...stats,
        })
      }
    </RichText>
  );
};

interface SnowDynamicsProps extends WidgetCardBaseProps {
  stats: SnowDynamicsStats;
}

const SnowDynamics: FC<SnowDynamicsProps> = ({ id, stats }) => {
  const t = useTranslations("widgets.snow_dynamics");

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={<Description stats={stats} />}
      icon={
        <WidgetCardIcon
          icon={<SnowflakeIcon className="size-5 text-indigo-700" />}
          backgroundColor="#4F46E5"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <LineChart
        title="Mean Snow Duration per Winter (days)"
        data={mockData}
        chartConfig={chartConfig}
      />
    </WidgetCard>
  );
};

export default SnowDynamics;
