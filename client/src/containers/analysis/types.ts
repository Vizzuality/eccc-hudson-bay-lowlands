import type { Translatable } from "@/types";

export interface TimeSeriesDataPoint {
  x: string;
  y: number;
}

export interface CategoricalDataPoint {
  key: string;
  label: Translatable;
  value: number;
}

export interface BaseWidgetData<
  TChart extends TimeSeriesDataPoint | CategoricalDataPoint,
  TStats,
> {
  unit: string;
  chart: TChart[];
  stats: TStats;
}

export interface LabeledWidgetData<
  TChart extends TimeSeriesDataPoint | CategoricalDataPoint,
  TStats,
> extends BaseWidgetData<TChart, TStats> {
  label: Translatable;
}

export interface PeatCarbonStats {
  peat_depth_avg: number;
  peat_depth_max: number;
  carbon_total: number;
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
  fsi_low_perc: string;
  fsi_moderate_perc: string;
  fsi_high_perc: string;
}

export interface SnowDynamicsStats {
  lengthT_mean: number;
  endL_mean_date: number;
}

export interface EcosystemTypesStats {
  ecosystem_count: number;
  dominant_ecosystem: string;
  dominant_ecosystem_perc: number;
}

export interface AnalysisResult {
  peat_carbon: LabeledWidgetData<TimeSeriesDataPoint, PeatCarbonStats>;
  water_dynamics: BaseWidgetData<CategoricalDataPoint, WaterDynamicsStats>;
  flood_susceptibility: BaseWidgetData<
    CategoricalDataPoint,
    FloodSusceptibilityStats
  >;
  snow_dynamics: LabeledWidgetData<TimeSeriesDataPoint, SnowDynamicsStats>;
  ecosystem_types: BaseWidgetData<CategoricalDataPoint, EcosystemTypesStats>;
}
