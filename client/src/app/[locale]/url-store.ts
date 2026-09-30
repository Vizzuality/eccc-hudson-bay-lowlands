import { type } from "arktype";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
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

export function useLayerIds() {
  const [layerIds, setLayerIds] = useQueryState(
    "layers",
    parseAsArrayOf(parseAsString).withDefault([]),
  );

  return { layerIds, setLayerIds };
}

const layerSettingsSchema = type<LayersSettings<unknown>>({});
export type LayersSettings<T> = Record<string, Record<string, T>>;

function parseLayersSettings(value: unknown): LayersSettings<unknown> | null {
  const result = layerSettingsSchema(value);
  if (result instanceof type.errors) return null;
  return result as LayersSettings<unknown>;
}

export const layersSettingsParser = parseAsJson(parseLayersSettings);

export const useSyncLayersSettings = () => {
  const [layersSettings, setLayersSettings] = useQueryState(
    "layers-settings",
    layersSettingsParser,
  );

  return { layersSettings, setLayersSettings };
};

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
    parseAsStringEnum(Object.keys(BASEMAPS)).withDefault(BasemapId.LIGHT),
  );

  return { basemap, setBasemap };
}

export function useDataLayersSearch() {
  const [dataLayersSearch, setDataLayersSearch] = useQueryState(
    "dataLayersSearch",
    parseAsString,
  );

  return { dataLayersSearch, setDataLayersSearch };
}
