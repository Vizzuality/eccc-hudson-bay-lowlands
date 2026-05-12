import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

import type { AnalysisResult } from "@/containers/analysis/types";
import type { ParsedGeoJSON } from "@/lib/utils/geometry-upload";

type AnalysisSettings = {
  locationType: "draw" | "upload";
  geometry: ParsedGeoJSON | null;
  fileName: string | null;
};

const initialValue: AnalysisSettings = {
  locationType: "draw",
  geometry: null,
  fileName: null,
};

const analysisSettingsAtom = atom<AnalysisSettings>(initialValue);
const analysisResultAtom = atom<AnalysisResult | null>(null);
const isAnalyzingAtom = atom(false);

export default function useAnalysisSettings() {
  return [...useAtom(analysisSettingsAtom), initialValue] as const;
}

export function useAnalysisResult() {
  return useAtomValue(analysisResultAtom);
}

export function useSetAnalysisResult() {
  return useSetAtom(analysisResultAtom);
}

export function useIsAnalyzing() {
  return useAtom(isAnalyzingAtom);
}
