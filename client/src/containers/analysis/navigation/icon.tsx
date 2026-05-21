import {
  AtomIcon,
  DropletsIcon,
  GlobeIcon,
  SnowflakeIcon,
  TreesIcon,
  WavesIcon,
} from "lucide-react";
import type { FC } from "react";

const AnalysisNavigationIcon: FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case "peat_carbon":
      return <AtomIcon />;
    case "water_dynamics":
      return <DropletsIcon />;
    case "flood_susceptibility":
      return <WavesIcon />;
    case "snow_dynamics":
      return <SnowflakeIcon />;
    case "treed_area":
      return <TreesIcon />;
    case "ecosystem_classification":
      return <GlobeIcon />;
  }
};

export default AnalysisNavigationIcon;
