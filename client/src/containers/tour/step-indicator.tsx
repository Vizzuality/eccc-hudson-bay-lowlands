import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={`tour-step-dot-${i + 1}`}
          className={cn(
            "h-2 rounded-full transition-[width] duration-300 motion-reduce:transition-none",
            i + 1 === current
              ? "w-5 bg-linear-[160deg] from-emerald-500/90 from-5% to-emerald-950/90 to-95%"
              : "w-2 bg-slate-300",
          )}
        />
      ))}
    </div>
  );
}
