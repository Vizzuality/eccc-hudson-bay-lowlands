import {
  AtomIcon,
  DropletsIcon,
  GlobeIcon,
  SnowflakeIcon,
  TreesIcon,
  WavesIcon,
} from "lucide-react";
import type { FC } from "react";

interface WidgetIconProps {
  id: string;
  className?: string;
}

const WidgetIcon: FC<WidgetIconProps> = ({ id, className }) => {
  switch (id) {
    case "peat_carbon":
      return <AtomIcon className={className} />;
    case "water_dynamics":
      return <DropletsIcon className={className} />;
    case "flood_susceptibility":
      return <WavesIcon className={className} />;
    case "snow_dynamics":
      return <SnowflakeIcon className={className} />;
    case "treed_area":
      return <TreesIcon className={className} />;
    case "ecosystem_classification":
      return <GlobeIcon className={className} />;
  }
};

export default WidgetIcon;
