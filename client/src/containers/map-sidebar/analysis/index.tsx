"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import RichText from "@/components/ui/rich-text";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AnalysisProvider,
  useAnalysisViewportRef,
} from "@/containers/analysis/analysis-context";
import AnalysisNavigation from "@/containers/analysis/navigation";
import WidgetSection from "@/containers/analysis/widget-section";
import CloseDialog from "@/containers/map-sidebar/analysis/close-dialog";
import ShareButton from "@/containers/share-button";
import { WIDGETS } from "@/containers/widgets/constants";
import ShareWidget from "@/containers/widgets/share";

function AnalysisPanel({ onLeaveRequest }: { onLeaveRequest: () => void }) {
  const t = useTranslations("analysis");
  const viewportRef = useAnalysisViewportRef();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="min-w-0 shrink-0 space-y-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-4xl font-normal leading-10">{t("title")}</h1>
          <ShareButton size="xl" className="font-bold" />
          <Button
            variant="secondary"
            size="icon"
            className="size-14"
            onClick={onLeaveRequest}
            aria-label="Leave analysis"
          >
            <XIcon />
          </Button>
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

      <div className="shrink-0">
        <AnalysisNavigation />
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportRef={viewportRef}>
        <section className="space-y-4">
          {WIDGETS.map((widget) => (
            <WidgetSection
              key={`analysis-widget-section-${widget.id}`}
              id={widget.id}
            >
              <widget.component id={widget.id} />
            </WidgetSection>
          ))}
          <ShareWidget />
        </section>
      </ScrollArea>
    </div>
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
