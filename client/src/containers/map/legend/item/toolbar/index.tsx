import { EyeClosedIcon, EyeIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LegendItemToolbarProps } from "@/containers/map/legend/types";
import LegendItemButton from "./button";

export const LegendItemToolbar: React.FC<LegendItemToolbarProps> = ({
  id,
  settings,
  settingsManager,
  onRemove,
  onChangeVisibility,
}: LegendItemToolbarProps) => {
  const t = useTranslations("legend");
  const { visibility = true } = settings || {};

  return (
    <div id="legend-toolbar" className="mt-0.5 flex divide-x">
      <div className="flex gap-2">
        {settingsManager?.visibility && (
          <div className="flex items-start">
            <Tooltip delayDuration={500}>
              <TooltipTrigger
                type="button"
                className="cursor-pointer"
                aria-label={visibility ? t("hide-layer") : t("show-layer")}
                onClick={() => {
                  if (onChangeVisibility) onChangeVisibility(!visibility);
                }}
              >
                <LegendItemButton Icon={visibility ? EyeIcon : EyeClosedIcon} />
              </TooltipTrigger>

              <TooltipContent side="top" align="end" alignOffset={-10}>
                <div className="text-xxs">
                  {visibility ? t("hide-layer") : t("show-layer")}
                </div>

                <TooltipArrow className="fill-white" width={10} height={5} />
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {settingsManager?.remove && onRemove && (
          <div className="flex items-start">
            <Tooltip delayDuration={500}>
              <TooltipTrigger
                type="button"
                className="cursor-pointer"
                aria-label={t("remove-layer")}
                onClick={() => {
                  if (onRemove) onRemove(id);
                }}
              >
                <LegendItemButton Icon={XIcon} />
              </TooltipTrigger>

              <TooltipContent side="top" align="end" alignOffset={-10}>
                <div className="text-xxs">{t("remove-layer")}</div>

                <TooltipArrow className="fill-white" width={10} height={5} />
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegendItemToolbar;
