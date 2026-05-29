import type { FC } from "react";
import type { InteractiveFeature } from "@/containers/map/store";
import FeatureDetailTooltip from "@/containers/map/tooltip/components/feature-detail";
import FeaturePropertiesTooltip from "@/containers/map/tooltip/components/feature-properties";
import FeatureValueTooltip from "@/containers/map/tooltip/components/feature-value";
import type { InteractionConfig, LegendItem } from "@/types";

function renderFeature(
  type: string,
  feature: InteractiveFeature,
  key: number,
  legendItems: LegendItem[] | null,
) {
  switch (type) {
    case "feature-value":
      return (
        <FeatureValueTooltip
          key={key}
          properties={feature.properties}
          legendItems={legendItems}
        />
      );
    case "feature-detail":
      return <FeatureDetailTooltip key={key} properties={feature.properties} />;
    case "feature-properties":
      return (
        <FeaturePropertiesTooltip key={key} properties={feature.properties} />
      );
    default:
      return null;
  }
}

interface MapPopupItemProps {
  type: InteractionConfig["type"];
  features: InteractiveFeature[];
  legendItems: LegendItem[] | null;
}

const MapPopupItem: FC<MapPopupItemProps> = ({
  type,
  features,
  legendItems,
}) => {
  return (
    <>
      {features.map((feature, i) =>
        renderFeature(type, feature, i, legendItems),
      )}
    </>
  );
};

export default MapPopupItem;
