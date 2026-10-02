import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MobileNavItem = {
  id: string;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  current?: boolean;
  cta?: boolean;
};

type MobileNavProps = {
  label: string;
  items: MobileNavItem[];
};

export function MobileNav({ label, items }: Readonly<MobileNavProps>) {
  return (
    <nav
      aria-label={label}
      data-download-exclude
      className="absolute inset-x-0 bottom-0 z-10 p-4 lg:hidden"
    >
      <ul className="flex rounded-full bg-background p-2 shadow-md">
        {items.map(({ id, label, onClick, icon: Icon, current, cta }) => (
          <li
            key={`mobile-nav-${id}`}
            className={cn(cta ? "basis-[138px]" : "flex-1")}
          >
            <Button
              variant={cta ? "default" : "ghost"}
              aria-current={current ? "true" : undefined}
              onClick={onClick}
              className={cn(
                "h-14 w-full font-bold text-xs leading-5",
                cta ? "px-4" : "flex-col gap-1 px-2 hover:bg-transparent",
              )}
            >
              {Icon && (
                <span
                  className={cn("rounded-full", current && "bg-accent p-2")}
                >
                  <Icon aria-hidden />
                </span>
              )}
              {label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
