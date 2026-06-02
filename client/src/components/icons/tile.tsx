import type { FC, PropsWithChildren } from "react";
import CheckedIcon from "@/components/icons/check";
import { cn } from "@/lib/utils";

interface TileIconProps extends PropsWithChildren {
  state?: "default" | "drawing" | "checked";
  className?: string;
}
const TileIcon: FC<TileIconProps> = ({
  state = "default",
  className,
  children,
}) => {
  const isChecked = state === "checked";
  const isTilted = state !== "default";
  const tiltStyle = isTilted
    ? { transform: "translate(-6px, -6px) rotate(-15deg) scale(1.04)" }
    : undefined;

  return (
    <div className={cn("relative size-16", className)}>
      <div className={cn("relative size-16", className)}>
        <div className="absolute inset-0 opacity-100">
          <div
            className="absolute inset-0 rounded-[9.52971px] bg-linear-to-br from-[#10B981] to-[#022C22] origin-[0%_100%]"
            style={tiltStyle}
          />
          <div
            className="absolute inset-0 rounded-[9.52971px] bg-white/10 origin-[0%_100%]"
            style={tiltStyle}
          />
        </div>

        <div className="absolute inset-0 rounded-[9.52971px] bg-white/10 backdrop-blur-[2px] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {isChecked ? <CheckedIcon width={24} height={24} /> : children}
        </div>
      </div>
    </div>
  );
};

export default TileIcon;
