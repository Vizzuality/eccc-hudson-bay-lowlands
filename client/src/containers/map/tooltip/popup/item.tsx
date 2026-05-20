import { useAtomValue } from "jotai";
import type { FC } from "react";
import {
  type InteractiveFeature,
  interactiveLayerAtom,
} from "@/containers/map/store";
import FeatureDetailTooltip from "@/containers/map/tooltip/components/feature-detail";
import FeaturePropertiesTooltip from "@/containers/map/tooltip/components/feature-properties";
import FeatureValueTooltip from "@/containers/map/tooltip/components/feature-value";

function renderFeature(type: string, feature: InteractiveFeature, key: number) {
  switch (type) {
    case "feature-value":
      return <FeatureValueTooltip key={key} properties={feature.properties} />;
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

const MapPopupItem: FC = () => {
  const interactiveLayer = useAtomValue(interactiveLayerAtom);

  if (!interactiveLayer) return null;

  return (
    <>
      {interactiveLayer.features.map((feature, i) =>
        renderFeature(interactiveLayer.type, feature, i),
      )}
    </>
  );
};

export default MapPopupItem;
