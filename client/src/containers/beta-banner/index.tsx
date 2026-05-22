"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import RichText from "@/components/ui/rich-text";

const STORAGE_KEY = "beta-banner-dismissed-at";
const COOLDOWN_DAYS = 7;

function isDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (!dismissed) return false;
  return dayjs().diff(dayjs(Number(dismissed)), "day") < COOLDOWN_DAYS;
}

const BetaBanner = () => {
  const t = useTranslations("beta-banner");
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(true);
  const { default: mapRef } = useMap();

  useEffect(() => {
    if (isDismissedRecently()) {
      setOpen(false);
      setMounted(false);
    }
  }, []);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "collapsible-up") {
      setMounted(false);
      mapRef?.resize();
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Collapsible open={open}>
      <CollapsibleContent
        className="animation-duration-[300ms]"
        onAnimationEnd={handleAnimationEnd}
      >
        <Alert className="rounded-none px-8 border-0 border-b border-secondary bg-(--transparency-white-80,rgba(255,255,255,0.80)) [backdrop-filter:blur(calc(var(--blur-lg)/2))]">
          <AlertDescription className="text-sm font-semibold text-foreground flex items-center justify-between gap-2.5">
            <RichText>{(tags) => t.rich("message", tags)}</RichText>
            <Button
              size="sm"
              type="button"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, String(Date.now()));
                setOpen(false);
              }}
            >
              {t("dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BetaBanner;
