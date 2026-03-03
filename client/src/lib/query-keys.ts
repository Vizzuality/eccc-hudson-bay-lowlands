import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import type { DatasetFilters } from "@/lib/schema";

export const queryKeys = createQueryKeyStore({
  categories: {
    all: null,
  },
  datasets: {
    all: (filters?: DatasetFilters) => ({
      queryKey: [{ filters: filters ?? {} }],
    }),
  },
  layers: null,
});
