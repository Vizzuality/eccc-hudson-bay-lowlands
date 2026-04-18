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
  layers: {
    all: null,
    byId: (id: string) => ({
      queryKey: [{ id }],
    }),
  },
  cog: {
    tileInfo: (path: string) => [{ path }],
  },
});
