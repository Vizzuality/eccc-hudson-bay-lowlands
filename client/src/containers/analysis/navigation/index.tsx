"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";
import { useAnalysisWidgetSpy } from "@/containers/analysis/analysis-context";
import { useWidgets } from "@/hooks/use-widgets";
import { cn } from "@/lib/utils";

const AnalysisNavigation = () => {
  const widgets = useWidgets();
  const { activeWidgetId } = useAnalysisWidgetSpy();

  useEffect(() => {
    if (!activeWidgetId) {
      return;
    }
    const el = document.querySelector(
      `[data-analysis-nav="${CSS.escape(activeWidgetId)}"]`,
    );
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeWidgetId]);

  return (
    <HorizontalScrollArea>
      <ul className="flex gap-2 w-max pb-4">
        {widgets.map((widget) => {
          const isActive = activeWidgetId === widget.id;
          return (
            <li
              key={`analysis-navigation-${widget.id}`}
              data-analysis-nav={widget.id}
            >
              <Button
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "text-xs font-bold leading-5",
                  !isActive &&
                    "bg-(--transparency-white-40,rgba(255,255,255,0.40)) [backdrop-filter:blur(calc(var(--blur-lg)/2))] text-muted-foreground hover:bg-primary hover:text-primary-foreground",
                )}
                onClick={() => {
                  document
                    .getElementById(widget.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {widget.title}
              </Button>
            </li>
          );
        })}
      </ul>
    </HorizontalScrollArea>
  );
};

export default AnalysisNavigation;
