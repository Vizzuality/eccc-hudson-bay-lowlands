"use client";

import { SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
  useState,
} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CONTROL_BUTTON_STYLES } from "../constants";

interface SettingsControlProps {
  id?: string;
  className?: HTMLAttributes<HTMLDivElement>["className"];
}

export const SettingsControl: FC<PropsWithChildren<SettingsControlProps>> = ({
  id,
  className,
  children,
}: PropsWithChildren<SettingsControlProps>) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const t = useTranslations("map.controls.settings");

  return (
    <div className={cn("flex flex-col space-y-0.5", className)}>
      <Popover onOpenChange={setPopoverOpen}>
        <Tooltip open={popoverOpen ? false : undefined}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                id={id}
                className={cn({
                  [CONTROL_BUTTON_STYLES.default]: true,
                  [CONTROL_BUTTON_STYLES.hover]: true,
                  [CONTROL_BUTTON_STYLES.active]: true,
                  [CONTROL_BUTTON_STYLES.open]: popoverOpen,
                })}
                aria-label={t("aria-label")}
                type="button"
              >
                <SettingsIcon className={CONTROL_BUTTON_STYLES.icon} />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">{t("tooltip")}</TooltipContent>
        </Tooltip>

        <PopoverContent
          side="left"
          align="start"
          className="w-auto overflow-hidden p-6"
        >
          {children}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SettingsControl;
