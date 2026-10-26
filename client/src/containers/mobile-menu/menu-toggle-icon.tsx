import { cn } from "@/lib/utils";

const BAR =
  "absolute left-0.5 h-0.5 w-5 rounded-[1px] bg-primary transition-all duration-200 ease-out motion-reduce:transition-none";

export function MenuToggleIcon({ isOpen }: Readonly<{ isOpen: boolean }>) {
  return (
    <span aria-hidden className="relative block size-6">
      <span
        className={cn(BAR, isOpen ? "top-[11px] rotate-45" : "top-[5px]")}
      />
      <span className={cn(BAR, "top-[11px]", isOpen && "opacity-0")} />
      <span
        className={cn(BAR, isOpen ? "top-[11px] -rotate-45" : "top-[17px]")}
      />
    </span>
  );
}
