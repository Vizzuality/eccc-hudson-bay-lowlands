import { atom } from "jotai";
import type {
  InteractionConfig,
  LayerCategory,
  LegendItem,
  Translatable,
} from "@/types";

export interface InteractiveFeature {
  properties: Record<string, unknown>;
}

interface InteractiveLayerEntryBase {
  layerId: string;
  dataLayerId: string;
  layerTitle: Translatable;
  legendItems: LegendItem[] | null;
}

export type InteractiveLayerEntry = InteractiveLayerEntryBase &
  (
    | {
        type: InteractionConfig["type"];
        features: InteractiveFeature[];
      }
    | {
        type: "raster-point";
        path: string;
        unit: string;
        categories: LayerCategory[] | null;
      }
  );

export const interactiveLayerAtom = atom<{
  longitude: number;
  latitude: number;
  layers: InteractiveLayerEntry[];
} | null>(null);
