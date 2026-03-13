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
    byId: (id: number) => ({
      queryKey: [{ id }],
    }),
  },
  cog: {
    tileInfo: (path: string) => [{ path }],
    validTileRequest: (path: string, colormap: string) => [{ path, colormap }],
  },
});
