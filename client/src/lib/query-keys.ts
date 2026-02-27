import { createQueryKeyStore } from "@lukemorales/query-key-factory";

export const queryKeys = createQueryKeyStore({
  categories: {
    all: null,
  },
  datasets: {
    all: null,
  },
  layers: null,
});
