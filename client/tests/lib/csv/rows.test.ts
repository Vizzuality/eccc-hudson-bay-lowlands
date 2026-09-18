import { describe, expect, it } from "vitest";
import { buildWidgetCsvRows } from "@/lib/csv/rows";
import type { Dataset, Translatable } from "@/types";

const dataset = {
  id: 1,
  category_id: 1,
  metadata: {
    title: { en: "Carbon and Peatlands", fr: "" },
    description: { en: "", fr: "" },
    source: { en: "ECCC", fr: "" },
    citation: { en: "ECCC 2026", fr: "" },
  },
  layers: [],
} as unknown as Dataset;

const baseParams = {
  unit: "cm",
  dataset,
  aoiSize: 1240.5,
  analysisUrl: null,
  exportedAt: "2026-09-17",
  translateField: (key: string) => key,
  translateMetadata: (key: string) => key,
  translateApi: (field: Translatable) => field.en,
};

describe("buildWidgetCsvRows", () => {
  it("keeps both peat_carbon histograms apart in the series column", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      widgetId: "peat_carbon",
      stats: { peat_depth_avg: 42.3 },
      chart: {
        peat_cog: [{ x: 10, y: 340 }],
        carbon_cog: [{ x: 5, y: 12.1 }],
      },
    });

    const chartRows = rows.filter((r) => r.section === "chart");

    expect(chartRows).toHaveLength(2);
    expect(chartRows.map((r) => r.series)).toEqual(["peat_cog", "carbon_cog"]);
    expect(chartRows.map((r) => r.value)).toEqual(["340", "12.1"]);
  });

  it("units the histogram bin and the count separately", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      widgetId: "peat_carbon",
      stats: {},
      chart: {
        peat_cog: [{ x: 12.5, y: 340.25 }],
        carbon_cog: [{ x: 5.3, y: 120.5 }],
      },
    });

    const chartRows = rows.filter((r) => r.section === "chart");

    expect(chartRows).toEqual([
      expect.objectContaining({
        series: "peat_cog",
        keyUnit: "cm",
        unit: "count",
      }),
      expect.objectContaining({
        series: "carbon_cog",
        keyUnit: "kg/m²",
        unit: "count",
      }),
    ]);
  });

  it("leaves key_unit empty on categorical slices and keeps their own unit", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      unit: "%",
      widgetId: "water_dynamics",
      stats: {},
      chart: {
        inundation_frequency_cog: [{ key: "water_perm_perc", value: 31.2 }],
      },
    });

    expect(rows.filter((r) => r.section === "chart")).toEqual([
      expect.objectContaining({
        key: "water_perm_perc",
        keyUnit: "",
        unit: "%",
      }),
    ]);
  });

  it("emits the ecosystem class id and its resolved name as separate rows", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      unit: "%",
      widgetId: "ecosystem_classification",
      stats: { dominant_ecosystem: 2 },
      chart: {},
      derivedStats: { dominant_ecosystem_label: "Treed Wetland" },
    });

    expect(rows).toContainEqual(
      expect.objectContaining({ key: "dominant_ecosystem", value: "2" }),
    );
    expect(rows).toContainEqual(
      expect.objectContaining({
        key: "dominant_ecosystem_label",
        value: "Treed Wetland",
      }),
    );
  });

  it("gives carbon_total its own unit rather than the widget unit", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      widgetId: "peat_carbon",
      stats: { peat_depth_avg: 42.3, carbon_total: 8.4 },
      chart: {},
    });

    const units = Object.fromEntries(rows.map((r) => [r.key, r.unit]));

    expect(units.peat_depth_avg).toBe("cm");
    expect(units.carbon_total).toBe("Mt");
  });

  it("omits the analysis url row when the analysis has not been shared", () => {
    const rows = buildWidgetCsvRows({
      ...baseParams,
      widgetId: "peat_carbon",
      stats: {},
      chart: {},
    });

    expect(rows.some((r) => r.key === "analysis_url")).toBe(false);
  });
});
