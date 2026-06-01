"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import ShareButton from "@/containers/share-button";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";

function AnalysisPanel() {
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
