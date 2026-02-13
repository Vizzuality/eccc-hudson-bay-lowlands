import { parseAsStringEnum, useQueryState } from "nuqs";

enum MapStatus {
  default = "default",
  upload = "upload",
  analysis = "analysis",
}

export function useMapStatus() {
  return useQueryState(
    "mapStatus",
    parseAsStringEnum(Object.values(MapStatus)).withDefault(MapStatus.default),
  );
}
