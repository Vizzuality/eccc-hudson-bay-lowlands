import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from "nuqs";
import { BASEMAPS, BasemapId } from "@/containers/map/constants";

export enum MapStatus {
  default = "default",
  upload = "upload",
  analysis = "analysis",
}

export function useMapStatus() {
  const [mapStatus, setMapStatus] = useQueryState(
    "mapStatus",
    parseAsStringEnum(Object.values(MapStatus)).withDefault(MapStatus.default),
  );

  return { mapStatus, setMapStatus };
}

export function useCategory() {
  const [category, setCategory] = useQueryState("category", parseAsInteger);

  return { category, setCategory };
}

export function useLayers() {
  const [layers, setLayers] = useQueryState(
    "layers",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  return { layers, setLayers };
}

// TODO: Probably should be a shape object
export function useMapShape() {
  const [mapShape, setMapShape] = useQueryState(
    "mapShape",
    parseAsBoolean.withDefault(false),
  );

  return { mapShape, setMapShape };
}

export function useMapAnalysis() {
  const [datasets, setDatasets] = useQueryState(
    "datasets",
    parseAsBoolean.withDefault(false),
  );

  return { datasets, setDatasets };
}

export function useMapBasemap() {
  const [basemap, setBasemap] = useQueryState(
    "basemap",
    parseAsStringEnum(Object.keys(BASEMAPS)).withDefault(BasemapId.DEFAULT),
  );

  return { basemap, setBasemap };
}
