"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import CloseDialog from "@/containers/map-sidebar/analysis/close-dialog";
import ShareButton from "@/containers/share-button";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";

function AnalysisPanel({ onLeaveRequest }: { onLeaveRequest: () => void }) {
  const t = useTranslations("analysis");
  const analysisResult = useAnalysisResult();
  const router = useRouter();

  useEffect(() => {
    if (!analysisResult) {
      router.push("/");
    }
  }, [analysisResult, router]);

  return (
    <AnalysisPanelContent
      headerActions={
        <>
          <ShareButton size="xl" className="font-bold" />
          <Button
            variant="secondary"
            size="icon"
            className="size-14"
            onClick={onLeaveRequest}
            aria-label={t("leave-aria-label")}
          >
            <XIcon />
          </Button>
        </>
      }
    />
  );
}

const Analysis = () => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  return (
    <AnalysisProvider>
      <section className="flex h-full min-h-0 flex-col">
        <AnalysisPanel onLeaveRequest={() => setShowCloseDialog(true)} />
        <CloseDialog open={showCloseDialog} onOpenChange={setShowCloseDialog} />
      </section>
    </AnalysisProvider>
  );
};

export default Analysis;
