import { DropletsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type { WaterDynamicsStats } from "@/containers/analysis/types";
import DonutChart from "@/containers/charts/donut-chart";
import Highlight from "@/containers/highlight";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import { useApiTranslation } from "@/i18n/api-translation";

const mockData = [
  {
    water_perm_perc: {
      label: { en: "Permanent Dry Land", fr: "Eau permanente" },
      value: 8.3,
    },
    water_ephemeral_perc: {
      label: { en: "Ephemeral Water", fr: "Eau ephemerale" },
      value: 23.5,
    },
    land_perm_perc: {
      label: { en: "Land permanent", fr: "Terre permanente" },
      value: 68.2,
    },
  },
];

interface WaterDynamicsProps extends WidgetCardBaseProps {
  unit: string;
  stats: WaterDynamicsStats;
}

const WaterDynamics: FC<WaterDynamicsProps> = ({ id, unit, stats }) => {
  const t = useTranslations("widgets.water_dynamics");
  const { getTranslation } = useApiTranslation();
  const data = Object.entries(mockData[0]).map(([key, value]) => ({
    key,
    label: getTranslation(value.label),
    value: value.value,
    fill: `var(--color-${key})`,
  }));

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              water_perm_perc: 8.3,
              water_ephemeral_perc: 23.5,
              land_perm_perc: 68.2,
              freq_mean: 14.7,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<DropletsIcon className="size-5 text-sky-500" />}
          backgroundColor="#0EA5E9"
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
            water_perm_perc: {
              color: "var(--color-yellow-500)",
            },
            water_ephemeral_perc: {
              color: "var(--color-sky-400)",
            },
            land_perm_perc: {
              color: "var(--color-green-500)",
            },
          }}
        />
        <div className="space-y-3">
          <RichText className="text-muted-foreground text-sm font-medium leading-5">
            {(tags) =>
              t.rich("description-2", {
                ...tags,
                ...stats,
              })
            }
          </RichText>
          <MoreInfoTooltip title={t("more-info.title")}>
            {t("more-info.description")}
          </MoreInfoTooltip>
          <div className="flex gap-2">
            <Highlight
              label="Wetter"
              value={`${stats.trend_wetter_perc}${unit}`}
              className="text-sky-600"
            />
            <Highlight
              label="Dried"
              value={`${stats.trend_drier_perc}${unit}`}
              className="text-yellow-600"
            />
            <Highlight
              label="Stable"
              value={`${stats.trend_stable_perc}${unit}`}
            />
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default WaterDynamics;
