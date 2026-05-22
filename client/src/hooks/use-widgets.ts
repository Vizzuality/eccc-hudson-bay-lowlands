import { useTranslations } from "next-intl";
import type { AnalysisResult, WidgetId } from "@/containers/analysis/types";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";

export function useWidgets() {
  const t = useTranslations();
  const analysisResult = useAnalysisResult();

  return (Object.keys(analysisResult ?? {}) as (keyof AnalysisResult)[])
    .filter((id): id is WidgetId => id !== "aoi_size")
    .map((id) => ({
      id,
      title: t(`widgets.${id}.title`),
    }));
}
