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
  "data-tour"?: string;
}>;

export const Controls: FC<ControlsProps> = ({
  className = "absolute top-6 right-6",
  children,
  "data-tour": dataTour,
}: ControlsProps) => (
  <PopoverProvider>
    <div
      data-download-exclude
      data-tour={dataTour}
      className={cn({
        "flex flex-col items-center justify-center space-y-3": true,
        [className]: !!className,
      })}
    >
      {Children.map(children, (child) => child)}
    </div>
  </PopoverProvider>
);

export default Controls;
