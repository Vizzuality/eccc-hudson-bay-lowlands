import { atom, useAtom } from "jotai";

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

export default function useAnalysisSettings() {
  return [...useAtom(analysisSettingsAtom), initialValue] as const;
}
