import CarbonPeatland from "@/containers/widgets/carbon-peatland";
import EcosystemTypes from "@/containers/widgets/ecosystem-types";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import SnowDynamics from "@/containers/widgets/snow-dynamics";
import TreeCoverChange from "@/containers/widgets/tree-cover-change";
import WaterDynamics from "@/containers/widgets/water-dynamics";

export const WIDGETS = [
  { id: "carbon_peatlands", component: CarbonPeatland },
  { id: "water_dynamics", component: WaterDynamics },
  { id: "flood_susceptibility", component: FloodSusceptibility },
  { id: "snow_dynamics", component: SnowDynamics },
  { id: "tree_cover_change", component: TreeCoverChange },
  { id: "ecosystem_types", component: EcosystemTypes },
];
