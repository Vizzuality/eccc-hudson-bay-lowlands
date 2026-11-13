"use client";

import { useEffect, useState } from "react";
import { ChartsPausedContext } from "@/components/ui/chart";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import { useLeaveAnalysis } from "@/containers/analysis/close-dialog/use-leave-analysis";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import { MAP_INSET_DURATION_MS } from "@/containers/map-layout/constants";
import ShareButton from "@/containers/share-button";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";

function AnalysisPanel() {
  const analysisResult = useAnalysisResult();
  const { resetAnalysis } = useLeaveAnalysis();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!analysisResult) {
      resetAnalysis();
    }
  }, [analysisResult, resetAnalysis]);

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
  const [chartsPaused, setChartsPaused] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(
      () => setChartsPaused(false),
      MAP_INSET_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnalysisProvider>
      <ChartsPausedContext value={chartsPaused}>
        <section className="flex h-full min-h-0 flex-col">
          <AnalysisPanel />
        </section>
      </ChartsPausedContext>
    </AnalysisProvider>
  );
};

export default Analysis;
