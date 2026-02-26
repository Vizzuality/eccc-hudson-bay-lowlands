export type Translatable = Record<string, string>;

export interface DataLayer {
  id: string;
  title: string;
  description: string;
}

export interface Category {
  id: number;
  metadata: {
    title: Translatable;
  };
}

export interface CategoryResponse {
  data: Category[];
  total: number;
}
