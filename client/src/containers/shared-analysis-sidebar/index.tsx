"use client";

import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import DataLayersPanel from "@/containers/data-layers/panel";
import ShareButton from "@/containers/share-button";
import AnalysisTour from "@/containers/tour/analysis-tour";
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function SharedAnalysisSidebar() {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <aside className="isolate flex h-full shrink-0">
      <div className="flex h-full w-(--sidebar-width) shrink-0 flex-col">
        <AnalysisPanelContent
          headerActions={
            <>
              <ShareButton size="xl" className="font-bold" />
              <CloseAnalysisButton />
            </>
          }
        />
      </div>
      <DataLayersPanel />
      <AnalysisTour />
    </aside>
  );
}
