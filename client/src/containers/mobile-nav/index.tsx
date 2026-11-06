import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ANALYSIS_CTA_TRANSITION_NAME = "analysis-cta";

export type MobileNavItem = {
  id: string;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  current?: boolean;
  cta?: boolean;
  variant?: "default" | "secondary";
  disabled?: boolean;
  tour?: string;
};

type MobileNavProps = {
  label?: string;
  items: MobileNavItem[];
  trailingAction?: Pick<
    MobileNavItem,
    "label" | "onClick" | "icon" | "tour"
  > & {
    transitionName?: string;
  };
  as?: "nav" | "div";
};

export function MobileNav({
  label,
  items,
  trailingAction,
  as: Container = "nav",
}: Readonly<MobileNavProps>) {
  const hasTabs = items.some(({ cta }) => !cta);
  const TrailingIcon = trailingAction?.icon;
  const isTrailingActionOnly = items.length === 0;
  const trailingButton = trailingAction && (
    <Button
      onClick={trailingAction.onClick}
      data-tour={trailingAction.tour}
      aria-label={isTrailingActionOnly ? undefined : trailingAction.label}
      className={cn(
        "h-[72px] rounded-full shadow-md",
        isTrailingActionOnly ? "flex-1" : "w-[72px] shrink-0",
      )}
      style={{ viewTransitionName: trailingAction.transitionName }}
    >
      {TrailingIcon && <TrailingIcon aria-hidden />}
      {isTrailingActionOnly && trailingAction.label}
    </Button>
  );

  return (
    <Container
      aria-label={Container === "nav" ? label : undefined}
      data-download-exclude
      className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 p-4 lg:hidden"
    >
      {!isTrailingActionOnly && (
        <ul
          className={cn(
            "flex flex-1",
            hasTabs ? "rounded-full bg-background p-2 shadow-md" : "gap-2",
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
              tour,
            }) => (
              <li key={`mobile-nav-${id}`} className="flex-1">
                <Button
                  variant={cta ? variant : "ghost"}
                  aria-current={current ? "true" : undefined}
                  disabled={disabled}
                  onClick={onClick}
                  data-tour={tour}
                  className={cn(
                    "w-full font-bold text-xs leading-5",
                    hasTabs ? "h-14" : "h-[72px] shadow-md",
                    cta ? "px-4" : "flex-col gap-1 px-2 hover:bg-transparent",
                  )}
                >
                  {Icon && (
                    <span
                      className={cn("rounded-full p-2", current && "bg-accent")}
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
      )}
      {trailingButton}
    </Container>
  );
}
