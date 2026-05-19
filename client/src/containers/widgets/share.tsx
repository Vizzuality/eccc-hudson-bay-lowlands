"use client";

import { LoaderCircleIcon, Share2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import TileIcon from "@/components/icons/tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useShareAnalysis } from "@/hooks/use-share-analysis";

const ShareWidget = () => {
  const t = useTranslations();
  const { triggerShare, isPending } = useShareAnalysis();

  return (
    <Card>
      <CardContent className="flex items-center gap-6">
        <TileIcon state="checked" className="size-10" />
        <div className="space-y-2">
          <p className="text-sm">{t("widgets.share.description")}</p>
          <Button
            variant="ghost"
            className="px-0!"
            onClick={triggerShare}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <Share2Icon />
            )}
            {t("share.title")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareWidget;
