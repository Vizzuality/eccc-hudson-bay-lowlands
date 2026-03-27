import { useTranslations } from "next-intl";
import { mockAnalysisResult } from "@/containers/map-sidebar/analysis/mockData";

export function useWidgets() {
  const t = useTranslations();

  return Object.keys(mockAnalysisResult).map((id) => ({
    id,
    title: t(`widgets.${id}.title`),
  }));
}
