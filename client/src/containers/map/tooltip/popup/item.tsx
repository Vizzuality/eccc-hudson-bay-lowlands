import { useAtomValue } from "jotai";
import type { FC } from "react";
import { interactiveLayerAtom } from "@/containers/map/store";
import FeatureDetailTooltip from "@/containers/map/tooltip/components/feature-detail";
import FeaturePropertiesTooltip from "@/containers/map/tooltip/components/feature-properties";
import FeatureValueTooltip from "@/containers/map/tooltip/components/feature-value";

const MapPopupItem: FC = () => {
  const interactiveLayer = useAtomValue(interactiveLayerAtom);

  if (!interactiveLayer) return null;

  const { properties } = interactiveLayer;

  switch (interactiveLayer.type) {
    case "feature-value":
      return <FeatureValueTooltip properties={properties} />;
    case "feature-detail":
      return <FeatureDetailTooltip properties={properties} />;
    case "feature-properties":
      return <FeaturePropertiesTooltip properties={properties} />;
    default:
      return null;
  }
};

export default MapPopupItem;
