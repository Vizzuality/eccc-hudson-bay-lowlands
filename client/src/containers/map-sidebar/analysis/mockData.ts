import type { AnalysisResult } from "@/containers/analysis/types";

export const mockAnalysisResult: AnalysisResult = {
  aoi_size: 100,
  peat_carbon: {
    unit: "cm",
    chart: {
      peat_cog: [
        { x: 2018, y: 120 },
        { x: 2019, y: 135 },
      ],
      carbon_cog: [
        { x: 2018, y: 38 },
        { x: 2019, y: 42 },
      ],
    },
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
    chart: {
      inundation_frequency_cog: [
        { key: "water_perm_perc", value: 8.3 },
        { key: "water_ephemeral_perc", value: 23.5 },
        { key: "land_perm_perc", value: 68.2 },
      ],
    },
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
    chart: {
      flood_susceptibility_cog: [
        { key: "fsi_low_perc", value: 20 },
        { key: "fsi_moderate_perc", value: 30 },
        { key: "fsi_high_perc", value: 50 },
      ],
    },
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
    chart: {
      snow_cog: [
        { x: 2018, y: 95 },
        { x: 2019, y: 98 },
      ],
    },
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
    chart: {
      treed_cog: [
        {
          key: "non_treed_perc",
          value: 50,
        },
        {
          key: "always_treed_perc",
          value: 25,
        },
        {
          key: "newly_treed_perc",
          value: 15,
        },
        {
          key: "was_treed_perc",
          value: 10,
        },
      ],
    },
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
      always_treed_area: 50,
      always_treed_perc: 25,
      changed_treed_area: 20,
      newly_treed_area: 50,
      newly_treed_perc: 25,
      non_treed_area: 100,
      non_treed_perc: 50,
      total_treed_area: 100,
      was_treed_area: 30,
      was_treed_perc: 15,
    },
  },
  ecosystem_classification: {
    unit: "cm",
    chart: {
      eco_cog: [
        {
          key: "eco_temperate_perc",
          value: 50,
        },
        {
          key: "eco_treed_perc",
          value: 10,
        },
        {
          key: "eco_bog_perc",
          value: 5,
        },
      ],
    },
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
      dominant_ecosystem: 1,
      dominant_ecosystem_perc: 50,
      eco_bog_perc: 5,
      eco_coastal_perc: 3,
      eco_emergent_perc: 4,
      eco_fire_perc: 2,
      eco_graminoid_perc: 6,
      eco_grassland_perc: 3,
      eco_marine_perc: 2,
      eco_mudflats_perc: 1,
      eco_shrub_perc: 4,
      eco_temperate_perc: 50,
      eco_treed_perc: 10,
      eco_water_perc: 10,
      ecosystem_count: 10,
    },
  },
};
