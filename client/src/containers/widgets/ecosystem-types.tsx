import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import type {
  CategoricalDataPoint,
  EcosystemTypesStats,
} from "@/containers/analysis/types";
import TreeMap from "@/containers/charts/tree-map";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import WidgetIcon from "@/containers/widgets/icon";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";
import { useApiTranslation } from "@/i18n/api-translation";
import type { Layer } from "@/types";

const ECOSYSTEM_LAYER_ID = "ecosystem_classification_cog";

// Maps each analysis stat key to its ecosystem class id, mirroring the
// frac_sum values in api/services/widgets.py. The class id keys into the
// layer's colormap so the chart matches the colors the map renders.
const ECO_KEY_TO_CLASS: Record<string, number> = {
  eco_temperate_perc: 1,
  eco_treed_perc: 2,
  eco_grassland_perc: 3,
  eco_fire_perc: 4,
  eco_graminoid_perc: 5,
  eco_shrub_perc: 6,
  eco_emergent_perc: 7,
  eco_bog_perc: 8,
  eco_mudflats_perc: 9,
  eco_coastal_perc: 10,
  eco_marine_perc: 11,
  eco_water_perc: 12,
};

const FALLBACK_CHART_CONFIG = {
  eco_temperate_perc: {
    color: "var(--color-green-800)",
  },
  eco_treed_perc: {
    color: "var(--color-green-600)",
  },
  eco_grassland_perc: {
    color: "var(--color-lime-500)",
  },
  eco_graminoid_perc: {
    color: "var(--color-emerald-500)",
  },
  eco_fire_perc: {
    color: "var(--color-red-500)",
  },
  eco_shrub_perc: {
    color: "var(--color-green-300)",
  },
  eco_emergent_perc: {
    color: "var(--color-teal-500)",
  },
  eco_bog_perc: {
    color: "var(--color-amber-700)",
  },
  eco_mudflats_perc: {
    color: "var(--color-yellow-900)",
  },
  eco_coastal_perc: {
    color: "var(--color-cyan-500)",
  },
  eco_marine_perc: {
    color: "var(--color-blue-500)",
  },
  eco_water_perc: {
    color: "var(--color-sky-400)",
  },
};

function getColormapColor(
  colormap: NonNullable<Layer["config"]>["colormap"] | undefined,
  classId: number,
): string | undefined {
  if (!colormap) return undefined;
  if (Array.isArray(colormap)) {
    return colormap.find(([value]) => value === classId)?.[1];
  }
  return colormap[String(classId)];
}

interface EcosystemTypesProps extends WidgetCardBaseProps {
  stats: EcosystemTypesStats;
  chart: Record<string, CategoricalDataPoint[]>;
  layers: Layer[];
  onInfoButtonClick: () => void;
}

const EcosystemTypes: FC<EcosystemTypesProps> = ({
  id,
  stats,
  chart,
  layers,
  onInfoButtonClick,
}) => {
  const t = useTranslations("widgets.ecosystem_classification");
  const { getTranslation } = useApiTranslation();

  const ecosystemLayer = layers.find(
    (layer) => layer.id === ECOSYSTEM_LAYER_ID,
  );
  const colormap = ecosystemLayer?.config?.colormap;

  const chartConfig = Object.fromEntries(
    Object.entries(FALLBACK_CHART_CONFIG).map(([key, fallback]) => [
      key,
      {
        color:
          getColormapColor(colormap, ECO_KEY_TO_CLASS[key]) ?? fallback.color,
      },
    ]),
  );

  const data = Object.values(chart)
    .flat()
    .map((item) => ({
      key: item.key,
      label: t(`chart.${item.key}`),
      value: item.value,
      fill: chartConfig[item.key].color,
    }));

  const dominantEcosystemLabel = ecosystemLayer?.categories?.find(
    (category) => category.value === stats.dominant_ecosystem,
  )?.label;

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
              dominant_ecosystem: dominantEcosystemLabel
                ? getTranslation(dominantEcosystemLabel)
                : stats.dominant_ecosystem,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<WidgetIcon id={id} className="size-5 text-amber-500" />}
          backgroundColor="#F59E0B"
        />
      }
      layers={layers}
      onInfoButtonClick={onInfoButtonClick}
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
