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
  variant?: "default" | "secondary";
  disabled?: boolean;
};

type MobileNavProps = {
  label?: string;
  items: MobileNavItem[];
  as?: "nav" | "div";
};

export function MobileNav({
  label,
  items,
  as: Container = "nav",
}: Readonly<MobileNavProps>) {
  const hasTabs = items.some(({ cta }) => !cta);

  return (
    <Container
      aria-label={Container === "nav" ? label : undefined}
      data-download-exclude
      className="absolute inset-x-0 bottom-0 z-10 p-4 lg:hidden"
    >
      <ul
        className={cn(
          "flex rounded-full bg-background p-2 shadow-md",
          !hasTabs && "gap-2",
        )}
      >
        {items.map(
          ({
            id,
            label,
            onClick,
            icon: Icon,
            current,
            cta,
            variant = "default",
            disabled,
          }) => (
            <li
              key={`mobile-nav-${id}`}
              className={cn(cta && hasTabs ? "basis-[138px]" : "flex-1")}
            >
              <Button
                variant={cta ? variant : "ghost"}
                aria-current={current ? "true" : undefined}
                disabled={disabled}
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
          ),
        )}
      </ul>
    </Container>
  );
}
