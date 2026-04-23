import { TooltipPortal } from "@radix-ui/react-tooltip";
import { MousePointerClickIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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

const getMainButtonText = (
  mapStatus: MapStatus,
  t: (key: string) => string,
) => {
  switch (mapStatus) {
    case MapStatus.default:
      return t("analyze-area");
    case MapStatus.upload:
      return t("cancel");
    case MapStatus.analysis:
      return t("datasets");
  }
};

const MainButton: FC = () => {
  const t = useTranslations("analysis");
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
          <Button type="button" size="xl" onClick={handleButtonClick}>
            <MainButtonIcon mapStatus={mapStatus} datasets={datasets} />
            {getMainButtonText(mapStatus, t)}
          </Button>
        </TooltipTrigger>
      </PopoverTrigger>

      {!popoverOpen && mapStatus === MapStatus.default && (
        <TooltipPortal>
          <TooltipContent side="bottom" align="center">
            {t("click-to-select")}
          </TooltipContent>
        </TooltipPortal>
      )}
    </>
  );
};

export default MainButton;
