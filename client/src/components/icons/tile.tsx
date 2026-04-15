import type { FC, PropsWithChildren } from "react";
import CheckedIcon from "@/components/icons/check";
import { cn } from "@/lib/utils";

interface TileIconProps extends PropsWithChildren {
  state?: "default" | "checked";
  className?: string;
}
const TileIcon: FC<TileIconProps> = ({
  state = "default",
  className,
  children,
}) => {
  const isChecked = state === "checked";
  const tiltStyle = isChecked
    ? { transform: "translate(-6px, -6px) rotate(-15deg) scale(1.04)" }
    : undefined;

  return (
    <div className={cn("relative size-16", className)}>
      <div className={cn("group relative size-16", className)}>
        <div className="absolute inset-0 opacity-100">
          <div
            className={`absolute inset-0 rounded-[9.52971px] bg-linear-to-br from-[#10B981] to-[#022C22] origin-[0%_100%] ${
              isChecked
                ? ""
                : "animate-none group-hover:animate-[uploadbar-question-tilt_300ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
            }`}
            style={tiltStyle}
          />
          <div
            className={`absolute inset-0 rounded-[9.52971px] bg-white/10 origin-[0%_100%] ${
              isChecked
                ? ""
                : "animate-none group-hover:animate-[uploadbar-question-tilt_300ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
            }`}
            style={tiltStyle}
          />
        </div>

        <div className="absolute inset-0 rounded-[9.52971px] bg-white/10 backdrop-blur-[2px] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" />

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {isChecked ? <CheckedIcon width={24} height={24} /> : children}
        </div>
      </div>

      <style jsx>{`
        @keyframes uploadbar-question-tilt {
          from {
            transform: translate(0px, 0px) rotate(0deg) scale(1);
          }
          to {
            transform: translate(-6px, -6px) rotate(-15deg) scale(1.04);
          }
        }
      `}</style>
    </div>
  );
};

export default TileIcon;
