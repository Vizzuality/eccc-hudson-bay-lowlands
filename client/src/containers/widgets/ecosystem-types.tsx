import { GlobeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type { EcosystemTypesStats } from "@/containers/analysis/types";
import TreeMap from "@/containers/charts/tree-map";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import { useApiTranslation } from "@/i18n/api-translation";

const mockData = [
  {
    key: "eco_temperate_perc",
    label: { en: "Temperate", fr: "Tempéré" },
    value: 50,
  },
  {
    key: "eco_treed_perc",
    label: { en: "Treed", fr: "Arboré" },
    value: 30,
  },
  {
    key: "eco_grassland_perc",
    label: { en: "Grassland", fr: "Prairie" },
    value: 20,
  },
  {
    key: "eco_graminoid_perc",
    label: { en: "Graminoid", fr: "Graminoid" },
    value: 10,
  },
];
const chartConfig = {
  eco_temperate_perc: {
    color: "var(--color-green-800)",
  },
  eco_treed_perc: {
    color: "var(--color-green-600)",
  },
  eco_grassland_perc: {
    color: "var(--color-green-300)",
  },
  eco_graminoid_perc: {
    color: "var(--color-green-800)",
  },
};

interface EcosystemTypesProps extends WidgetCardBaseProps {
  stats: EcosystemTypesStats;
}

const EcosystemTypes: FC<EcosystemTypesProps> = ({ id, stats }) => {
  const t = useTranslations("widgets.ecosystem_types");
  const { getTranslation } = useApiTranslation();
  const data = mockData.map((item) => ({
    key: item.key,
    label: getTranslation(item.label),
    value: item.value,
    fill: chartConfig[item.key as keyof typeof chartConfig].color,
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
              ...stats,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<GlobeIcon className="size-5 text-amber-500" />}
          backgroundColor="#F59E0B"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <TreeMap data={data} chartConfig={chartConfig} />
    </WidgetCard>
  );
};

export default EcosystemTypes;
