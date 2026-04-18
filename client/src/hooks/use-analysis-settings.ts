import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

import type { AnalysisResult } from "@/containers/analysis/types";
import type { convertFilesToGeojson } from "@/lib/utils/geometry-upload";

type AnalysisSettings = {
  locationType: "draw" | "upload";
  geometry: Awaited<ReturnType<typeof convertFilesToGeojson>> | null;
};

const initialValue: AnalysisSettings = {
  locationType: "draw",
  geometry: null,
};

const analysisSettingsAtom = atom<AnalysisSettings>(initialValue);
const analysisResultAtom = atom<AnalysisResult | null>(null);

export default function useAnalysisSettings() {
  return [...useAtom(analysisSettingsAtom), initialValue] as const;
}

export function useAnalysisResult() {
  return useAtomValue(analysisResultAtom);
}

export function useSetAnalysisResult() {
  return useSetAtom(analysisResultAtom);
}
