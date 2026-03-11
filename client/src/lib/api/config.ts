import type { AxiosRequestConfig } from "axios";
import type { DatasetFilters } from "@/lib/schema";

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

export const getLayerConfig = (id: number): AxiosRequestConfig => ({
  url: `/layers/${id}`,
});

export const getTileJsonConfig = (
  path: string,
  tileMatrixSetId: string = "WebMercatorQuad",
): AxiosRequestConfig => ({
  url: `/cog/${tileMatrixSetId}/tilejson.json?url=${path}`,
});
