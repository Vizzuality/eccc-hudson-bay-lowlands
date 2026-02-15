import { TooltipPortal } from "@radix-ui/react-tooltip";
import { MousePointerClickIcon, PlusIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import {
  MapStatus,
  useMapAnalysis,
  useMapStatus,
} from "@/app/[locale]/url-store";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MainButtonIcon: FC<{ mapStatus: MapStatus; datasets: boolean }> = ({
  mapStatus,
  datasets,
}) => {
  switch (mapStatus) {
    case MapStatus.default:
      return <MousePointerClickIcon />;
    case MapStatus.upload:
      return <XIcon />;
    case MapStatus.analysis:
      return datasets ? <XIcon /> : <PlusIcon />;
    default:
      return <MousePointerClickIcon />;
  }
};

const getMainButtonText = (mapStatus: MapStatus) => {
  switch (mapStatus) {
    case MapStatus.default:
      return "Analyze area";
    case MapStatus.upload:
      return "Cancel";
    case MapStatus.analysis:
      return "Datasets";
  }
};

const MainButton: FC = () => {
  const { mapStatus, setMapStatus } = useMapStatus();
  const { datasets, setDatasets } = useMapAnalysis();
  const popoverOpen = mapStatus === MapStatus.upload;
  const handleButtonClick = () => {
    switch (mapStatus) {
      case MapStatus.default:
        setMapStatus(MapStatus.upload);
        break;
      case MapStatus.upload:
        setMapStatus(MapStatus.default);
        break;
      case MapStatus.analysis:
        setDatasets(!datasets);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <PopoverTrigger asChild>
        <TooltipTrigger asChild autoFocus={false}>
          <Button type="button" onClick={handleButtonClick}>
            <MainButtonIcon mapStatus={mapStatus} datasets={datasets} />
            {getMainButtonText(mapStatus)}
          </Button>
        </TooltipTrigger>
      </PopoverTrigger>

      {!popoverOpen && mapStatus === MapStatus.default && (
        <TooltipPortal>
          <TooltipContent side="bottom" align="center">
            Click to select your area of interest and get detailed insights on
            it.
          </TooltipContent>
        </TooltipPortal>
      )}
    </>
  );
};

export default MainButton;
