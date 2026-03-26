import CarbonPeatland from "@/containers/widgets/carbon-peatland";
import EcosystemTypes from "@/containers/widgets/ecosystem-types";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import SnowDynamics from "@/containers/widgets/snow-dynamics";
import TreeCoverChange from "@/containers/widgets/tree-cover-change";
import WaterDynamics from "@/containers/widgets/water-dynamics";

export const WIDGETS = [
  { id: "carbon-peatlands", component: CarbonPeatland },
  { id: "water-dynamics", component: WaterDynamics },
  { id: "flood-susceptibility", component: FloodSusceptibility },
  { id: "snow-dynamics", component: SnowDynamics },
  { id: "tree-cover-change", component: TreeCoverChange },
  { id: "ecosystem-types", component: EcosystemTypes },
];
