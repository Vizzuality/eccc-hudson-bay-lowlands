"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { SettingsIcon } from "lucide-react";
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

  return (
    <div className={cn("flex flex-col space-y-0.5", className)}>
      <Popover onOpenChange={setPopoverOpen}>
        <Tooltip delayDuration={300}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild autoFocus={false}>
              <button
                id={id}
                className={cn({
                  [CONTROL_BUTTON_STYLES.default]: true,
                  [CONTROL_BUTTON_STYLES.hover]: true,
                  [CONTROL_BUTTON_STYLES.active]: true,
                  [CONTROL_BUTTON_STYLES.open]: popoverOpen,
                })}
                aria-label="Map settings"
                type="button"
              >
                <SettingsIcon />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>

          {!popoverOpen && (
            <TooltipPortal>
              <TooltipContent side="left" align="center">
                <div className="text-xxs">Map settings</div>
              </TooltipContent>
            </TooltipPortal>
          )}

          <PopoverContent
            side="left"
            align="start"
            className="w-auto overflow-hidden p-6"
          >
            {children}
          </PopoverContent>
        </Tooltip>
      </Popover>
    </div>
  );
};

export default SettingsControl;
