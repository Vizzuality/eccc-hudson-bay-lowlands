"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import ShareButton from "@/containers/share-button";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";

function AnalysisPanel() {
  const analysisResult = useAnalysisResult();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!analysisResult) {
      router.push("/");
    }
  }, [analysisResult, router]);

  if (isMobile) return null;

  return (
    <AnalysisPanelContent
      headerActions={
        <>
          <ShareButton size="xl" className="font-bold" />
          <CloseAnalysisButton />
        </>
      }
    />
  );
}

const Analysis = () => {
  return (
    <AnalysisProvider>
      <section className="flex h-full min-h-0 flex-col">
        <AnalysisPanel />
      </section>
    </AnalysisProvider>
  );
};

export default Analysis;
