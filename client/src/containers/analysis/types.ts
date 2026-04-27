import type { Translatable } from "@/types";

export interface TimeSeriesDataPoint {
  x: number;
  y: number;
}

export interface CategoricalDataPoint {
  key: string;
  label: Translatable;
  value: number;
}

export interface WidgetLayer {
  id: string;
  path: string;
  title: Translatable;
}

export interface WidgetData<
  TChart extends TimeSeriesDataPoint | CategoricalDataPoint,
  TStats,
> {
  unit: string;
  chart: Record<string, TChart[]>;
  stats: TStats;
  layers: WidgetLayer[];
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
  selected_winter: string;
  lengthT_mean: number;
  endL_mean_date: string;
}

export interface EcosystemTypesStats {
  ecosystem_count: number;
  dominant_ecosystem: string;
  dominant_ecosystem_perc: number;
}

export interface TreeCoverChangeStats {
  total_treed_area: number;
  newly_treed_area: number;
  was_treed_area: number;
  changed_treed_area: number;
}

export interface AnalysisResult {
  peat_carbon: WidgetData<TimeSeriesDataPoint, PeatCarbonStats>;
  water_dynamics: WidgetData<CategoricalDataPoint, WaterDynamicsStats>;
  flood_susceptibility: WidgetData<
    CategoricalDataPoint,
    FloodSusceptibilityStats
  >;
  snow_dynamics: WidgetData<TimeSeriesDataPoint, SnowDynamicsStats>;
  tree_cover_change: WidgetData<CategoricalDataPoint, TreeCoverChangeStats>;
  ecosystem_types: WidgetData<CategoricalDataPoint, EcosystemTypesStats>;
}
