import { type } from "arktype";

export const datasetFilters = type({
  "offset?": "number",
  "limit?": "1 <= number <= 100",
  "search?": "string",
  "category_id?": "number",
  "include_layers?": "boolean",
});

export type DatasetFilters = typeof datasetFilters.infer;
