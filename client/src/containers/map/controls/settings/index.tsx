"use client";

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
        <PopoverTrigger asChild>
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
            <SettingsIcon className={CONTROL_BUTTON_STYLES.icon} />
          </button>
        </PopoverTrigger>

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
