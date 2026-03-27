import type { LayerProps } from "react-map-gl/mapbox";

export type Translatable = Record<string, string>;

export interface ApiResponse<T> {
  data: T[];
  total: number;
}

export interface Category {
  id: number;
  metadata: {
    title: Translatable;
  };
}

export interface NormalizedCategory {
  id: number;
  name: string;
}

export interface CategorySelectorItem extends NormalizedCategory {
  layerCount: number;
}

export type CategoryResponse = ApiResponse<Category>;

interface DatasetMetadata<T> {
  title: T;
  description: T;
  source: T;
  citation: T;
}

interface BaseDataset<T> {
  id: number;
  metadata: DatasetMetadata<T>;
  category_id: number;
  layers?: Layer[];
}

export interface LayerMetadata {
  title: Translatable;
  description: Translatable;
}

export interface LayerCategory {
  value: number;
  label: Translatable;
}

export interface LegendItem {
  value: number;
  color: string;
  label: Translatable;
}
export interface LayerConfig {
  colormap: [number, string][] | Record<string, string>;
  styles: LayerProps[];
  params_config: {
    key: string;
    default: unknown;
  }[];
  legend_config: {
    type: "gradient" | "basic";
    items: LegendItem[];
  };
}

export interface Layer {
  id: number;
  format: string;
  type: string;
  path: string;
  unit: string;
  categories: LayerCategory[] | null;
  metadata: LayerMetadata;
  dataset_id: number;
  config: LayerConfig | null;
}

export interface WidgetData {
  peat_carbon: {
    label: Translatable;
    unit: string;
    chart: { x: string; y: number }[];
    stats: {
      peat_depth_avg: number;
      peat_depth_max: number;
      carbon_total: number;
    };
  };
  water_dynamics: {
    unit: string;
    chart: { key: string; label: Translatable; value: number }[];
    stats: {
      water_perm_perc: number;
      water_ephemeral_perc: number;
      land_perm_perc: number;
      freq_mean: number;
      trend_wetter_perc: number;
      trend_drier_perc: number;
      trend_stable_perc: number;
    };
  };
  flood_susceptibility: {
    chart: { key: string; label: Translatable; value: number }[];
    stats: {
      fsi_avg: number;
      fsi_low_perc: string;
      fsi_moderate_perc: string;
      fsi_high_perc: string;
    };
  };
  snow_dynamics: {
    chart: { key: string; label: Translatable; value: number }[];
    stats: {
      lengthT_mean: number;
      endL_mean_date: number;
    };
  };
}

export type LayersResponse = ApiResponse<Layer>;
export type LayerResponse = Layer;

export interface Dataset extends BaseDataset<Translatable> {}

export interface NormalizedDataset extends BaseDataset<string> {}

export type DatasetResponse = ApiResponse<Dataset>;

export interface TileInfoResponse {
  tilejson: string;
  version: string;
  scheme: string;
  tiles: string[];
  minzoom: number;
  maxzoom: number;
  bounds: [number, number, number, number];
  center: number[];
}
