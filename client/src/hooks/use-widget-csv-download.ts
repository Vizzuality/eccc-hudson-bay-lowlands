"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import type { WidgetId } from "@/containers/analysis/types";
import { useAnalysisResult } from "@/hooks/use-analysis-settings";
import { useApiTranslation } from "@/i18n/api-translation";
import { buildWidgetCsvRows } from "@/lib/csv/rows";
import { toCsv } from "@/lib/csv/serialize";
import { formatDate } from "@/lib/utils/date";
import type { Layer } from "@/types";

const ECOSYSTEM_LAYER_ID = "ecosystem_classification_cog";

const triggerDownload = (csv: string, fileName: string) => {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  // Safari cancels an in-flight download if its blob URL is revoked in the same task
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const resolveEcosystemLabel = (
  layers: Layer[] | undefined,
  dominant: number | string | undefined,
  translate: (
    field: NonNullable<Layer["categories"]>[number]["label"],
  ) => string,
): string | undefined => {
  const category = layers
    ?.find((layer) => layer.id === ECOSYSTEM_LAYER_ID)
    ?.categories?.find((item) => item.value === dominant);

  return category ? translate(category.label) : undefined;
};

export function useWidgetCsvDownload(widgetId: WidgetId) {
  const analysisResult = useAnalysisResult();
  const analysisId = useParams<{ id?: string }>()?.id;
  const locale = useLocale();
  const { getTranslation } = useApiTranslation();
  const translateField = useTranslations(`widgets.${widgetId}`);
  const translateMetadata = useTranslations("csv");

  const download = useCallback(() => {
    if (!analysisResult) return;

    const widget = analysisResult[widgetId];
    const stats = Object.fromEntries(Object.entries(widget.stats));
    const dominantLabel = resolveEcosystemLabel(
      widget.dataset.layers,
      stats.dominant_ecosystem,
      getTranslation,
    );

    const rows = buildWidgetCsvRows({
      widgetId,
      unit: widget.unit,
      stats,
      chart: widget.chart,
      dataset: widget.dataset,
      aoiSize: analysisResult.aoi_size,
      analysisUrl: analysisId
        ? `${window.location.origin}/${locale}/analysis/${analysisId}`
        : null,
      exportedAt: formatDate(),
      derivedStats: dominantLabel
        ? { dominant_ecosystem_label: dominantLabel }
        : undefined,
      translateField: (key) => translateField(key),
      translateMetadata: (key) => translateMetadata(key),
      translateApi: getTranslation,
    });

    triggerDownload(
      toCsv(rows),
      `hudson-bay-lowlands-${widgetId}-${formatDate()}.csv`,
    );
  }, [
    analysisResult,
    widgetId,
    analysisId,
    locale,
    getTranslation,
    translateField,
    translateMetadata,
  ]);

  return { download };
}
