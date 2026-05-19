"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import RichText from "@/components/ui/rich-text";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisViewportRef } from "@/containers/analysis/analysis-context";
import AnalysisNavigation from "@/containers/analysis/navigation";
import type { AnalysisResult } from "@/containers/analysis/types";
import WidgetSection from "@/containers/analysis/widget-section";
import ShareDialog from "@/containers/dialogs/share";
import Widget from "@/containers/widgets";
import ShareWidget from "@/containers/widgets/share";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";
import { useShareAnalysis } from "@/hooks/use-share-analysis";

interface AnalysisPanelContentProps {
  headerActions?: ReactNode;
}

export default function AnalysisPanelContent({
  headerActions,
}: AnalysisPanelContentProps) {
  const t = useTranslations("analysis");
  const viewportRef = useAnalysisViewportRef();
  const analysisResult = useAnalysisResult();
  const { createdAt, shareUrl, shareDialogOpen, setShareDialogOpen } =
    useShareAnalysis();

  if (!analysisResult) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="min-w-0 shrink-0 space-y-4 mb-4 px-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-4xl font-normal leading-10">{t("title")}</h1>
          {headerActions}
        </div>
        <RichText className="text-muted-foreground text-sm">
          {(tags) =>
            t.rich("description", {
              ...tags,
              aoi_size: 100,
            })
          }
        </RichText>
      </header>

      <div className="shrink-0 px-6">
        <AnalysisNavigation />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-6" viewportRef={viewportRef}>
        <section className="space-y-4">
          {(Object.keys(analysisResult) as (keyof AnalysisResult)[]).map(
            (id) => (
              <WidgetSection key={`analysis-widget-section-${id}`} id={id}>
                <Widget id={id} data={analysisResult} />
              </WidgetSection>
            ),
          )}
          <ShareWidget />
        </section>
      </ScrollArea>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={shareUrl ?? ""}
        createdAt={createdAt ?? new Date().toISOString()}
      />
    </div>
  );
}
