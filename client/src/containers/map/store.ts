import { atom } from "jotai";
import type { InteractionConfig, LegendItem, Translatable } from "@/types";

export interface InteractiveFeature {
  properties: Record<string, unknown>;
}

export interface InteractiveLayerEntry {
  layerId: string;
  dataLayerId: string;
  layerTitle: Translatable;
  legendItems: LegendItem[] | null;
  type: InteractionConfig["type"];
  features: InteractiveFeature[];
}

export const interactiveLayerAtom = atom<{
  longitude: number;
  latitude: number;
  layers: InteractiveLayerEntry[];
} | null>(null);
