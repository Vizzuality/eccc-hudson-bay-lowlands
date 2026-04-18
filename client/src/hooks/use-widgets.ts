import { useTranslations } from "next-intl";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";

export function useWidgets() {
  const t = useTranslations();
  const analysisResult = useAnalysisResult();

  return Object.keys(analysisResult ?? {}).map((id) => ({
    id,
    title: t(`widgets.${id}.title`),
  }));
}
