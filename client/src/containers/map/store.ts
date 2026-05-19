import { atom } from "jotai";
import type { InteractionConfig, LegendItem, Translatable } from "@/types";

export const interactiveLayerAtom = atom<{
  layerId: string;
  layerTitle: Translatable;
  legendItems: LegendItem[] | null;
  longitude: number;
  latitude: number;
  type: InteractionConfig["type"];
  properties: Record<string, unknown>;
} | null>(null);
