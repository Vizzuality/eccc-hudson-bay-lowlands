"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import RichText from "@/components/ui/rich-text";

const COOKIE_NAME = "beta-dismissed";
const MAX_AGE = 7 * 24 * 60 * 60;

const BetaBanner = () => {
  const t = useTranslations("beta-banner");
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(true);
  const { default: mapRef } = useMap();

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
                // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Firefox support
                document.cookie = `${COOKIE_NAME}=${Date.now()}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
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
