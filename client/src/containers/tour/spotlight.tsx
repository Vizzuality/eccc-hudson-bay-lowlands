import type { Ref } from "react";
import type { TourStep } from "@/containers/tour/steps";
import type { Rect } from "@/containers/tour/use-target-rect";
import { cn } from "@/lib/utils";

const PADDING = 4;

interface SpotlightProps {
  rect: Rect | null;
  shape: TourStep["shape"];
  ref?: Ref<HTMLDivElement>;
}

export function Spotlight({ rect, shape, ref }: SpotlightProps) {
  return (
    <>
      <div aria-hidden className="fixed inset-0 z-50" />
      {rect ? (
        <div
          ref={ref}
          aria-hidden
          className={cn(
            "pointer-events-none fixed z-50 border-3 border-white shadow-[0_0_0_9999px_rgb(2_6_23/0.6)] transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none",
            shape === "pill" ? "rounded-full" : "rounded-2xl",
          )}
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      ) : (
        <>
          <div aria-hidden className="fixed inset-0 z-50 bg-slate-950/60" />
          <div
            ref={ref}
            aria-hidden
            className="pointer-events-none fixed top-1/3 left-1/2 z-50 size-0"
          />
        </>
      )}
    </>
  );
}
