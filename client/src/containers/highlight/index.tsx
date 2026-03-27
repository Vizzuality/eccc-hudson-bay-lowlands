import type { FC } from "react";
import { cn } from "@/lib/utils";

interface HighlightProps {
  label: string;
  value: string;
  className?: string;
}
const Highlight: FC<HighlightProps> = ({ label, value, className }) => {
  return (
    <section
      className={cn(
        "bg-slate-100 px-3 py-2.5 space-y-0.5 rounded-xl",
        className,
      )}
      aria-label={label}
    >
      <div className="text-lg font-bold leading-5 text-foreground">{value}</div>
      <div className="text-2xs font-semibold leading-4 text-muted-foreground">
        {label}
      </div>
    </section>
  );
};

export default Highlight;
