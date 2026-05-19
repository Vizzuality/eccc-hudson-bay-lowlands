"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FC, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import RichText from "@/components/ui/rich-text";
import { getRemainingTime } from "@/lib/utils/date";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  createdAt: string;
}

const ShareDialog: FC<ShareDialogProps> = ({
  open,
  onOpenChange,
  url,
  createdAt,
}) => {
  const t = useTranslations("share-dialog");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            <RichText>{(tags) => t.rich("description", tags)}</RichText>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input type="url" value={url} readOnly />
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleCopy}
            aria-label={t("copy")}
          >
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          <RichText>
            {(tags) =>
              t.rich("expiration", {
                ...tags,
                date: getRemainingTime(createdAt, locale),
              })
            }
          </RichText>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
