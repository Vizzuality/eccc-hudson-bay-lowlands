import type { AnalysisResult } from "@/containers/analysis/types";

export const mockAnalysisResult: AnalysisResult = {
  peat_carbon: {
    unit: "cm",
    chart: [],
    stats: {
      peat_depth_avg: 242,
      peat_depth_max: 680,
      carbon_total: 48.2,
      carbon_density: 38.7,
    },
  },
  water_dynamics: {
    unit: "cm",
    chart: [],
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
    chart: [],
    stats: {
      fsi_avg: 50,
      fsi_low_perc: 20,
      fsi_moderate_perc: 30,
      fsi_high_perc: 50,
    },
  },
  snow_dynamics: {
    unit: "cm",
    chart: [],
    stats: {
      selected_winter: "2020–2021",
      lengthT_mean: 100,
      endL_mean_date: "April 15",
    },
  },
  tree_cover_change: {
    unit: "cm",
    chart: [],
    stats: {
      total_treed_area: 100,
      newly_treed_area: 50,
      was_treed_area: 30,
      changed_treed_area: 20,
    },
  },
  ecosystem_types: {
    unit: "cm",
    chart: [],
    stats: {
      ecosystem_count: 10,
      dominant_ecosystem: "Forest",
      dominant_ecosystem_perc: 50,
    },
  },
};
