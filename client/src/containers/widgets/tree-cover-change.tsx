import { TreesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type {
  TreeCoverChangeStats,
  WidgetLayer,
} from "@/containers/analysis/types";
import DonutChart from "@/containers/charts/donut-chart";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import { useApiTranslation } from "@/i18n/api-translation";

const mockData = [
  {
    key: "non_treed_perc",
    label: { en: "Non-Treed", fr: "Non Arboré" },
    value: 100,
  },
  {
    key: "always_treed_perc",
    label: { en: "Always Treed", fr: "Toujours Arboré" },
    value: 50,
  },
  {
    key: "newly_treed_perc",
    label: { en: "Newly-Treed", fr: "Nouvellement Arboré" },
    value: 20,
  },
  {
    key: "was_treed_perc",
    label: { en: "Was-Treed", fr: "Anciennement Arboré" },
    value: 20,
  },
];

interface TreeCoverChangeProps extends WidgetCardBaseProps {
  stats: TreeCoverChangeStats;
  layers: WidgetLayer[];
}

const TreeCoverChange: FC<TreeCoverChangeProps> = ({ id, stats, layers }) => {
  const t = useTranslations("widgets.tree_cover_change");
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
          icon={<TreesIcon className="size-5 text-green-600" />}
          backgroundColor="#16A34A"
        />
      }
      layers={layers}
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <div className="flex gap-4">
        <DonutChart
          data={data}
          chartConfig={{
            non_treed_perc: {
              color: "var(--color-yellow-900)",
            },
            always_treed_perc: {
              color: "var(--color-green-600)",
            },
            newly_treed_perc: {
              color: "var(--color-green-300)",
            },
            was_treed_perc: {
              color: "var(--color-green-800)",
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

export default TreeCoverChange;
