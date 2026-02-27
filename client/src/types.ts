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

export interface Layer {
  id: number;
  format: string;
  type: string;
  path: string;
  unit: string;
  categories: null;
  metadata: LayerMetadata;
  dataset_id: number;
}

export type LayersResponse = ApiResponse<Layer>;

export interface Dataset extends BaseDataset<Translatable> {}

export interface NormalizedDataset extends BaseDataset<string> {}

export type DatasetResponse = ApiResponse<Dataset>;
