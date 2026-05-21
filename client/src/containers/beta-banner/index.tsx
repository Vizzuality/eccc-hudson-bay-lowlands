"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import RichText from "@/components/ui/rich-text";

const DISMISS_DURATION_MS = 300;

const BetaBanner = () => {
  const t = useTranslations("beta-banner");
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => setMounted(false), DISMISS_DURATION_MS);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!mounted) {
    return null;
  }

  return (
    <Collapsible open={open}>
      <CollapsibleContent className="animation-duration-[300ms]">
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
