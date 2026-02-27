import type { Layer, NormalizedDataset } from "@/types";

export const DATA_LAYERS: NormalizedDataset[] = [
  {
    id: 1,
    category_id: 1,
    metadata: {
      title: "First Nation Locations",
      description: "Desc 1",
      source: "Source 1",
      citation: "Citation 1",
    },
  },
  {
    id: 2,
    category_id: 1,
    metadata: {
      title: "Caribou Ranges",
      description: "Desc 2",
      source: "Source 2",
      citation: "Citation 2",
    },
  },
  {
    id: 3,
    category_id: 1,
    metadata: {
      title: "Wetland Areas",
      description: "Desc 3",
      source: "Source 3",
      citation: "Citation 3",
    },
  },
];

export const LAYERS: Layer[] = [
  {
    id: 10,
    format: "geojson",
    type: "vector",
    path: "/path/10",
    unit: "km",
    categories: null,
    metadata: {
      title: { en: "Layer A", fr: "Couche A" },
      description: { en: "Layer A desc", fr: "Desc couche A" },
    },
    dataset_id: 1,
  },
  {
    id: 20,
    format: "geojson",
    type: "vector",
    path: "/path/20",
    unit: "km",
    categories: null,
    metadata: {
      title: { en: "Layer B", fr: "Couche B" },
      description: { en: "Layer B desc", fr: "Desc couche B" },
    },
    dataset_id: 1,
  },
];
