import { SnowflakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, useState } from "react";
import RichText from "@/components/ui/rich-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SnowDynamicsStats,
  TimeSeriesDataPoint,
} from "@/containers/analysis/types";
import LineChart from "@/containers/charts/line-chart";
import Highlight from "@/containers/highlight";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import type { Layer } from "@/types";

const WINTER_RANGES = [
  { key: "1819", label: "2018 - 2019" },
  { key: "1920", label: "2019 - 2020" },
  { key: "2021", label: "2020 - 2021" },
  { key: "2122", label: "2021 - 2022" },
  { key: "2223", label: "2022 - 2023" },
  { key: "2324", label: "2023 - 2024" },
] as const;

type WinterKey = (typeof WINTER_RANGES)[number]["key"];

const Description = ({
  stats,
  selectedWinter,
  onWinterChange,
}: {
  stats: SnowDynamicsStats;
  selectedWinter: WinterKey;
  onWinterChange: (value: WinterKey) => void;
}) => {
  const t = useTranslations("widgets.snow_dynamics");
  const selectedLabel =
    WINTER_RANGES.find((r) => r.key === selectedWinter)?.label ?? "";

  return (
    <RichText>
      {(tags) =>
        t.rich("description", {
          ...tags,
          selected_winter: selectedLabel,
          lengthT_mean: stats[`lengthT_mean_${selectedWinter}`],
          endL_mean_date: stats[`endL_mean_date_${selectedWinter}`],
          dropdown: (chunks) => (
            <Select
              value={selectedWinter}
              onValueChange={(v) => onWinterChange(v as WinterKey)}
            >
              <SelectTrigger
                size="sm"
                className="inline-flex h-auto border-0 p-0 font-bold text-foreground shadow-none"
              >
                <SelectValue>{chunks}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {WINTER_RANGES.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        })
      }
    </RichText>
  );
};

interface SnowDynamicsProps extends WidgetCardBaseProps {
  stats: SnowDynamicsStats;
  chart: Record<string, TimeSeriesDataPoint[]>;
  layers: Layer[];
  onInfoButtonClick: () => void;
}

const SnowDynamics: FC<SnowDynamicsProps> = ({
  id,
  stats,
  chart,
  layers,
  onInfoButtonClick,
}) => {
  const t = useTranslations("widgets.snow_dynamics");
  const [selectedWinter, setSelectedWinter] = useState<WinterKey>(
    WINTER_RANGES[0].key,
  );

  const chartConfig = {
    y: {
      label: t("chart-title"),
      color: "var(--color-indigo-700)",
    },
  };

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <Description
          stats={stats}
          selectedWinter={selectedWinter}
          onWinterChange={setSelectedWinter}
        />
      }
      icon={
        <WidgetCardIcon
          icon={<SnowflakeIcon className="size-5 text-indigo-700" />}
          backgroundColor="#4F46E5"
        />
      }
      layers={layers}
      onInfoButtonClick={onInfoButtonClick}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <LineChart
        title={t("chart-title")}
        data={chart.lengthT_mean ?? []}
        chartConfig={chartConfig}
      />
      <div className="flex gap-3">
        <Highlight
          label={t("avg-days")}
          value={String(stats[`lengthT_mean_${selectedWinter}`])}
          className="text-indigo-600"
        />
        <Highlight
          label={t("mean-end-date")}
          value={stats[`endL_mean_date_${selectedWinter}`]}
          className="text-indigo-600"
        />
      </div>
    </WidgetCard>
  );
};

export default SnowDynamics;
