import { atom } from "jotai";

export const tourStepIndexAtom = atom<number | null>(null);

export const tourAvailableAtom = atom(false);

export const openDatasetIdsAtom = atom<string[]>([]);

export const legendOpenAtom = atom(false);
