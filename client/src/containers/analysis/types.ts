import type { Dataset, Translatable } from "@/types";

export interface TimeSeriesDataPoint {
  x: number;
  y: number;
}

export interface CategoricalDataPoint {
  key: string;
  label: Translatable;
  value: number;
}

export interface WidgetData<
  TChart extends TimeSeriesDataPoint | CategoricalDataPoint,
  TStats,
> {
  unit: string;
  chart: Record<string, TChart[]>;
  stats: TStats;
  dataset: Dataset;
}
export interface PeatCarbonStats {
  peat_depth_avg: number;
  peat_depth_max: number;
  carbon_total: number;
  carbon_density: number;
}

export interface WaterDynamicsStats {
  water_perm_perc: number;
  water_ephemeral_perc: number;
  land_perm_perc: number;
  freq_mean: number;
  trend_wetter_perc: number;
  trend_drier_perc: number;
  trend_stable_perc: number;
}

export interface FloodSusceptibilityStats {
  fsi_avg: number;
  fsi_low_perc: number;
  fsi_moderate_perc: number;
  fsi_high_perc: number;
}

export interface SnowDynamicsStats {
  endL_mean_date_1819: string;
  endL_mean_date_1920: string;
  endL_mean_date_2021: string;
  endL_mean_date_2122: string;
  endL_mean_date_2223: string;
  endL_mean_date_2324: string;
  lengthT_mean_1819: number;
  lengthT_mean_1920: number;
  lengthT_mean_2021: number;
  lengthT_mean_2122: number;
  lengthT_mean_2223: number;
  lengthT_mean_2324: number;
}

export interface EcosystemTypesStats {
  dominant_ecosystem: number;
  dominant_ecosystem_perc: number;
  eco_bog_perc: number;
  eco_coastal_perc: number;
  eco_emergent_perc: number;
  eco_fire_perc: number;
  eco_graminoid_perc: number;
  eco_grassland_perc: number;
  eco_marine_perc: number;
  eco_mudflats_perc: number;
  eco_shrub_perc: number;
  eco_temperate_perc: number;
  eco_treed_perc: number;
  eco_water_perc: number;
  ecosystem_count: number;
}

export interface TreeCoverChangeStats {
  always_treed_area: number;
  always_treed_perc: number;
  changed_treed_area: number;
  newly_treed_area: number;
  newly_treed_perc: number;
  non_treed_area: number;
  non_treed_perc: number;
  total_treed_area: number;
  was_treed_area: number;
  was_treed_perc: number;
}

export interface AnalysisResult {
  peat_carbon: WidgetData<TimeSeriesDataPoint, PeatCarbonStats>;
  water_dynamics: WidgetData<CategoricalDataPoint, WaterDynamicsStats>;
  flood_susceptibility: WidgetData<
    CategoricalDataPoint,
    FloodSusceptibilityStats
  >;
  snow_dynamics: WidgetData<TimeSeriesDataPoint, SnowDynamicsStats>;
  treed_area: WidgetData<CategoricalDataPoint, TreeCoverChangeStats>;
  ecosystem_classification: WidgetData<
    CategoricalDataPoint,
    EcosystemTypesStats
  >;
}
