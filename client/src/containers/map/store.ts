import { atom } from "jotai";
import type { InteractionConfig, LegendItem, Translatable } from "@/types";

export interface InteractiveFeature {
  properties: Record<string, unknown>;
}

export const interactiveLayerAtom = atom<{
  layerId: string;
  layerTitle: Translatable;
  legendItems: LegendItem[] | null;
  longitude: number;
  latitude: number;
  type: InteractionConfig["type"];
  features: InteractiveFeature[];
} | null>(null);
