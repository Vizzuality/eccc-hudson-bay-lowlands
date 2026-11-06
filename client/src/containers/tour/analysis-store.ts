import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const analysisTourStepIndexAtom = atom<number | null>(null);

export const analysisTourAvailableAtom = atom(false);

export const analysisTourNudgeDismissedAtom = atomWithStorage(
  "analysis-tour-nudge-dismissed",
  false,
  undefined,
  { getOnInit: true },
);
