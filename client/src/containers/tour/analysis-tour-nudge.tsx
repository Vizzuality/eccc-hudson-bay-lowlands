"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { CircleQuestionMarkIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover as PopoverPrimitive } from "radix-ui";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import {
  analysisTourNudgeDismissedAtom,
  analysisTourStepIndexAtom,
} from "@/containers/tour/analysis-store";
import { Hotspots } from "@/containers/tour/hotspots";

interface AnalysisTourNudgeProps {
  anchorRef: RefObject<HTMLElement | null>;
  onStart: () => void;
}

export function useAnalysisTourNudgeVisible(available: boolean) {
  const dismissed = useAtomValue(analysisTourNudgeDismissedAtom);
  const tourIndex = useAtomValue(analysisTourStepIndexAtom);
  return available && !dismissed && tourIndex === null;
}

export function AnalysisTourNudge({
  anchorRef,
  onStart,
}: AnalysisTourNudgeProps) {
  const t = useTranslations("analysis-tour.nudge");
  const setDismissed = useSetAtom(analysisTourNudgeDismissedAtom);

  return (
    <>
      {createPortal(<Hotspots selector='[data-tour="help"]' />, document.body)}
      <PopoverPrimitive.Root open>
        <PopoverPrimitive.Anchor
          virtualRef={anchorRef as RefObject<HTMLElement>}
        />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="left"
            sideOffset={12}
            collisionPadding={16}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={() => setDismissed(true)}
            className="z-50 flex items-center gap-2 rounded-full bg-popover py-2.5 pr-3 pl-4 text-popover-foreground shadow-[0_10px_16px_rgb(41_77_164/0.1)] outline-hidden"
          >
            <button
              type="button"
              onClick={onStart}
              className="flex cursor-pointer items-center gap-2 rounded-full text-sm leading-5 font-bold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <CircleQuestionMarkIcon aria-hidden className="size-4" />
              {t("start")}
            </button>
            <button
              type="button"
              aria-label={t("dismiss")}
              onClick={() => setDismissed(true)}
              className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <XIcon aria-hidden className="size-3.5" />
            </button>
            <PopoverPrimitive.Arrow
              width={16}
              height={11}
              className="-translate-y-[3px] fill-popover"
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}
