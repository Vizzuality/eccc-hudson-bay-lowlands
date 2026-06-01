"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import CloseDialog from "@/containers/analysis/close-dialog";

const CloseAnalysisButton = () => {
  const t = useTranslations("analysis");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="size-14"
        onClick={() => setShowCloseDialog(true)}
        aria-label={t("leave-aria-label")}
      >
        <XIcon />
      </Button>
      <CloseDialog open={showCloseDialog} onOpenChange={setShowCloseDialog} />
    </>
  );
};

export default CloseAnalysisButton;
