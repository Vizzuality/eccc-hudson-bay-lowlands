"use client";

import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import DataLayersPanel from "@/containers/data-layers/panel";
import ShareButton from "@/containers/share-button";

export default function SharedAnalysisSidebar() {
  return (
    <aside className="flex h-full shrink-0">
      <div className="flex h-full w-[480px] min-[1440px]:w-[600px] shrink-0 flex-col">
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
    </aside>
  );
}
