import type {
  CategoricalDataPoint,
  TimeSeriesDataPoint,
  WidgetId,
} from "@/containers/analysis/types";
import type { CsvRow } from "@/lib/csv/serialize";
import { WIDGET_CSV_SPEC } from "@/lib/csv/widget-spec";
import type { Dataset } from "@/types";

type ChartPoint = TimeSeriesDataPoint | CategoricalDataPoint;

const isCategorical = (point: ChartPoint): point is CategoricalDataPoint =>
  "key" in point;

export interface BuildWidgetCsvRowsParams {
  widgetId: WidgetId;
  unit: string;
  stats: Record<string, number | string>;
  chart: Record<string, ChartPoint[]>;
  dataset: Dataset;
  aoiSize: number | null | undefined;
  analysisUrl: string | null;
  exportedAt: string;
  derivedStats?: Record<string, string>;
  translateField: (key: string) => string;
  translateMetadata: (key: string) => string;
  translateApi: (field: Dataset["metadata"]["title"]) => string;
}

const metadataRows = ({
  dataset,
  aoiSize,
  analysisUrl,
  exportedAt,
  translateMetadata,
  translateApi,
}: BuildWidgetCsvRowsParams): CsvRow[] => {
  const entries: [string, string, string][] = [
    ["exported_at", exportedAt, ""],
    ["aoi_size", aoiSize == null ? "" : String(aoiSize), "km²"],
    ["dataset_title", translateApi(dataset.metadata.title), ""],
    ["dataset_source", translateApi(dataset.metadata.source), ""],
    ["dataset_citation", translateApi(dataset.metadata.citation), ""],
  ];

  if (analysisUrl) entries.push(["analysis_url", analysisUrl, ""]);

  return entries.map(([key, value, unit]) => ({
    section: "metadata",
    series: "",
    key,
    keyUnit: "",
    label: translateMetadata(key),
    value,
    unit,
  }));
};

const statRows = (params: BuildWidgetCsvRowsParams): CsvRow[] => {
  const { widgetId, unit, stats, derivedStats, translateField } = params;
  const spec = WIDGET_CSV_SPEC[widgetId];
  const all = { ...stats, ...derivedStats };

  return Object.entries(all).map(([key, value]) => ({
    section: "stats",
    series: "",
    key,
    keyUnit: "",
    label: translateField(`fields.${key}`),
    value: String(value),
    unit: spec.stats[key] ?? unit,
  }));
};

const chartRows = (params: BuildWidgetCsvRowsParams): CsvRow[] => {
  const { widgetId, unit, chart, translateField } = params;
  const spec = WIDGET_CSV_SPEC[widgetId];

  return Object.entries(chart).flatMap(([series, points]) => {
    const seriesSpec = spec.chart[series];

    return points.map((point) => {
      const categorical = isCategorical(point);
      const key = categorical ? point.key : String(point.x);
      const value = categorical ? point.value : point.y;

      return {
        section: "chart" as const,
        series,
        key,
        keyUnit: seriesSpec?.keyUnit ?? "",
        label: translateField(
          categorical ? `fields.${key}` : `fields.${series}`,
        ),
        value: String(value),
        unit: seriesSpec?.unit ?? spec.stats[key] ?? unit,
      };
    });
  });
};

export const buildWidgetCsvRows = (
  params: BuildWidgetCsvRowsParams,
): CsvRow[] => [
  ...metadataRows(params),
  ...statRows(params),
  ...chartRows(params),
];
