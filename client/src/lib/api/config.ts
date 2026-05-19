import type { AxiosRequestConfig } from "axios";
import type { DatasetFilters } from "@/lib/schema";
import type { AnalysisResponse } from "@/types";

export const getCategoriesConfig: AxiosRequestConfig = {
  url: "/categories",
};

export const getDatasetsConfig = (
  params?: DatasetFilters,
): AxiosRequestConfig => ({
  url: "/datasets",
  params: {
    ...params,
  },
});

export const getLayersConfig: AxiosRequestConfig = {
  url: "/layers",
  params: {
    limit: 99,
  },
};

export const getLayerConfig = (id: string): AxiosRequestConfig => ({
  url: `/layers/${id}`,
});

export const getTileJsonConfig = (
  path: string,
  tileMatrixSetId: string = "WebMercatorQuad",
): AxiosRequestConfig => ({
  url: `/cog/${tileMatrixSetId}/tilejson.json?url=${path}`,
});

export const getHblAreaConfig: AxiosRequestConfig = {
  url: "/hbl-area",
};

export const postAnalysisConfig = (
  geometry: GeoJSON.Feature | GeoJSON.FeatureCollection,
): AxiosRequestConfig => ({
  url: "/analysis/v2",
  method: "POST",
  data: geometry,
});

export const shareAnalysisConfig = (
  analysis: AnalysisResponse,
  geojson: GeoJSON.Feature | GeoJSON.FeatureCollection,
): AxiosRequestConfig => ({
  url: "/analysis/v2/share",
  method: "POST",
  data: { analysis, geojson },
});

export const getSharedAnalysisConfig = (id: string): AxiosRequestConfig => ({
  url: `/analysis/v2/share/${id}`,
  method: "GET",
});
