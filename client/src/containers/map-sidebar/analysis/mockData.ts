import type { AnalysisResult } from "@/containers/analysis/types";

export const mockAnalysisResult: AnalysisResult = {
  peat_carbon: {
    unit: "cm",
    chart: {},
    dataset: {
      id: 1,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      peat_depth_avg: 242,
      peat_depth_max: 680,
      carbon_total: 48.2,
      carbon_density: 38.7,
    },
  },
  water_dynamics: {
    unit: "%",
    chart: {},
    dataset: {
      id: 2,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      water_perm_perc: 8.3,
      water_ephemeral_perc: 23.5,
      land_perm_perc: 68.2,
      freq_mean: 14.7,
      trend_wetter_perc: 12.4,
      trend_drier_perc: 8.1,
      trend_stable_perc: 79.5,
    },
  },
  flood_susceptibility: {
    unit: "cm",
    chart: {},
    dataset: {
      id: 3,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      fsi_avg: 50,
      fsi_low_perc: 20,
      fsi_moderate_perc: 30,
      fsi_high_perc: 50,
    },
  },
  snow_dynamics: {
    unit: "cm",
    chart: {},
    dataset: {
      id: 4,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      endL_mean_date_1819: "April 10",
      endL_mean_date_1920: "April 12",
      endL_mean_date_2021: "April 15",
      endL_mean_date_2122: "April 14",
      endL_mean_date_2223: "April 16",
      endL_mean_date_2324: "April 11",
      lengthT_mean_1819: 95,
      lengthT_mean_1920: 98,
      lengthT_mean_2021: 100,
      lengthT_mean_2122: 102,
      lengthT_mean_2223: 97,
      lengthT_mean_2324: 99,
    },
  },
  treed_area: {
    unit: "cm",
    chart: {},
    dataset: {
      id: 5,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      total_treed_area: 100,
      newly_treed_area: 50,
      was_treed_area: 30,
      changed_treed_area: 20,
    },
  },
  ecosystem_classification: {
    unit: "cm",
    chart: {},
    dataset: {
      id: 6,
      category_id: 1,
      metadata: {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
        source: { en: "", fr: "" },
        citation: { en: "", fr: "" },
      },
      layers: [],
    },
    stats: {
      ecosystem_count: 10,
      dominant_ecosystem: "Forest",
      dominant_ecosystem_perc: 50,
    },
  },
};
