"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMap } from "react-map-gl/mapbox";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import RichText from "@/components/ui/rich-text";

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
          <AlertDescription className="text-sm font-semibold text-foreground">
            <RichText>{(tags) => t.rich("message", tags)}</RichText>
          </AlertDescription>
          <AlertAction className="top-1/2 right-8 -translate-y-1/2">
            <Button size="sm" type="button" onClick={() => setOpen(false)}>
              {t("dismiss")}
            </Button>
          </AlertAction>
        </Alert>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default BetaBanner;
