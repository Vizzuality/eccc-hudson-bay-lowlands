import {
  ArrowDownIcon,
  CircleCheckIcon,
  EyeIcon,
  GripVerticalIcon,
  type LucideIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover as PopoverPrimitive } from "radix-ui";
import { type RefObject, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/containers/tour/step-indicator";
import type { TourStep } from "@/containers/tour/steps";

const SIDE_OFFSET = 16;

const CONTROL_LAYERS_OPTIONS: Array<{
  key: "visibility" | "remove" | "order" | "collapse";
  Icon: LucideIcon;
}> = [
  { key: "visibility", Icon: EyeIcon },
  { key: "remove", Icon: XIcon },
  { key: "order", Icon: GripVerticalIcon },
  { key: "collapse", Icon: ArrowDownIcon },
];

interface TourCardProps {
  step: TourStep;
  current: number;
  total: number;
  anchorRef: RefObject<HTMLDivElement | null>;
  hasTarget: boolean;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

function SuccessIcon() {
  return (
    <div aria-hidden className="relative size-16">
      <div className="absolute top-0 left-0 size-12 -rotate-6 rounded-[10px] bg-linear-[137deg] from-emerald-500/90 from-5% to-emerald-950/90 to-95%" />
      <div className="absolute right-0 bottom-0 flex size-12 items-center justify-center rounded-[10px] bg-white/10 text-white backdrop-blur-md">
        <CircleCheckIcon className="size-6" />
      </div>
    </div>
  );
}

export function TourCard({
  step,
  current,
  total,
  anchorRef,
  hasTarget,
  isFirst,
  isLast,
  onNext,
  onBack,
  onClose,
}: TourCardProps) {
  const t = useTranslations("tour");
  const titleId = useId();
  const focusOnMount = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus({ preventScroll: true });
  }, []);

  return (
    <PopoverPrimitive.Root
      open
      modal
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <PopoverPrimitive.Anchor
        virtualRef={anchorRef as RefObject<HTMLDivElement>}
      />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          aria-labelledby={titleId}
          side={hasTarget ? step.side : "bottom"}
          align={hasTarget ? step.align : "center"}
          sideOffset={hasTarget ? SIDE_OFFSET : 0}
          collisionPadding={16}
          updatePositionStrategy="always"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="z-60 flex max-h-(--radix-popover-content-available-height) w-[360px] flex-col overflow-y-auto gap-2 rounded-2xl bg-card p-6 text-card-foreground shadow-[0_10px_16px_rgb(41_77_164/0.1)] outline-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            {step.counted ? (
              <p
                aria-live="polite"
                className="text-xs leading-4 font-bold tracking-[1.2px] text-emerald-700 uppercase"
              >
                {t("step-label", { current, total })}
              </p>
            ) : (
              <SuccessIcon />
            )}
            <PopoverPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("close")}
                className="-mt-1 -mr-1"
              >
                <XIcon />
              </Button>
            </PopoverPrimitive.Close>
          </div>
          <h2
            id={titleId}
            key={step.id}
            ref={focusOnMount}
            tabIndex={-1}
            className="text-xl leading-7 font-semibold text-foreground outline-hidden"
          >
            {t(`steps.${step.id}.title`)}
          </h2>
          <p className="text-sm leading-5 font-medium text-muted-foreground">
            {t(`steps.${step.id}.description`)}
          </p>
          {step.id === "control-layers" && (
            <ul className="flex flex-col gap-0.5 text-sm leading-5 font-medium text-muted-foreground">
              {CONTROL_LAYERS_OPTIONS.map(({ key, Icon }) => (
                <li key={key} className="flex items-center gap-2 px-1">
                  <Icon aria-hidden className="size-5 shrink-0" />
                  {t(`steps.control-layers.${key}`)}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 pt-2">
            {step.counted && <StepIndicator current={current} total={total} />}
            <div className="flex flex-1 items-center justify-end gap-2">
              {!isFirst && (
                <Button
                  variant="ghost"
                  className="text-xs font-bold"
                  onClick={onBack}
                >
                  {t("back")}
                </Button>
              )}
              <Button
                className="text-xs font-bold"
                onClick={isLast ? onClose : onNext}
              >
                {isLast ? t("start-exploring") : t("next")}
              </Button>
            </div>
          </div>
          {hasTarget && (
            <PopoverPrimitive.Arrow
              width={16}
              height={8}
              className="fill-card"
            />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
