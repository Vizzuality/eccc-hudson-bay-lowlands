import { atom } from "jotai";
import type { InteractionConfig, Translatable } from "@/types";

export const interactiveLayerAtom = atom<{
  layerId: string;
  layerTitle: Translatable;
  longitude: number;
  latitude: number;
  type: InteractionConfig["type"];
  properties: Record<string, unknown>;
} | null>(null);
