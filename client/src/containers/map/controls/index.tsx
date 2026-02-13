"use client";

import {
  Children,
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { PopoverProvider } from "@/containers/map/controls/provider";
import { cn } from "@/lib/utils";

type ControlsProps = PropsWithChildren<{
  className?: HTMLAttributes<HTMLDivElement>["className"];
}>;

export const Controls: FC<ControlsProps> = ({
  className = "absolute top-20 right-4",
  children,
}: ControlsProps) => (
  <PopoverProvider>
    <div
      className={cn({
        "bg-foreground/10 flex flex-col items-center justify-center space-y-2 rounded-4xl p-0.5 backdrop-blur-lg": true,
        [className]: !!className,
      })}
    >
      {Children.map(children, (child) => child)}
    </div>
  </PopoverProvider>
);

export default Controls;
