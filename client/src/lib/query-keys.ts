import { createQueryKeyStore } from "@lukemorales/query-key-factory";

export const queryKeys = createQueryKeyStore({
  categories: {
    all: null,
  },
  datasets: null,
  layers: null,
});
