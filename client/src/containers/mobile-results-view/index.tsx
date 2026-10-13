"use client";

import { useIsMobileResultsViewOpen } from "@/app/[locale]/url-store";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import { PAGE_BACKGROUND } from "@/containers/map-layout/constants";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function MobileResultsView() {
  const isOpen = useIsMobileResultsViewOpen();
  const analysisResult = useAnalysisResult();
  const isMobile = useIsMobile();

  if (!isOpen || !analysisResult || !isMobile) return null;

  return (
    <AnalysisProvider>
      <section
        className="absolute inset-0 flex min-h-0 flex-col pt-6 lg:hidden"
        style={PAGE_BACKGROUND}
      >
        <AnalysisPanelContent widgetsClassName="pb-[120px]" />
      </section>
    </AnalysisProvider>
  );
}
