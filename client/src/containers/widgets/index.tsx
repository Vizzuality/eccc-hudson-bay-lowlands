import type { FC } from "react";
import type { AnalysisResult } from "@/containers/analysis/types";
import CarbonPeatland from "@/containers/widgets/carbon-peatland";
import EcosystemTypes from "@/containers/widgets/ecosystem-types";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import SnowDynamics from "@/containers/widgets/snow-dynamics";
import TreeCoverChange from "@/containers/widgets/tree-cover-change";
import WaterDynamics from "@/containers/widgets/water-dynamics";

interface WidgetProps {
  id: keyof AnalysisResult;
  data: AnalysisResult;
}

const Widget: FC<WidgetProps> = ({ id, data }) => {
  switch (id) {
    case "peat_carbon":
      return (
        <CarbonPeatland id={id} stats={data[id].stats} chart={data[id].chart} />
      );
    case "water_dynamics":
      return (
        <WaterDynamics id={id} unit={data[id].unit} stats={data[id].stats} />
      );
    case "flood_susceptibility":
      return <FloodSusceptibility id={id} stats={data[id].stats} />;
    case "snow_dynamics":
      return <SnowDynamics id={id} stats={data[id].stats} />;
    case "tree_cover_change":
      return <TreeCoverChange id={id} stats={data[id].stats} />;
    case "ecosystem_types":
      return <EcosystemTypes id={id} stats={data[id].stats} />;
    default:
      console.error(`Widget for id "${id}" not found`);
      return null;
  }
};

export default Widget;
