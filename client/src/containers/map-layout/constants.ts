export const PAGE_BACKGROUND = {
  background:
    "radial-gradient(113.99% 208.31% at 0% 0%, var(--slate-200, #E2E8F0) 0%, var(--base-white, #FFF) 50.96%, var(--emerald-50, #ECFDF5) 100%), #FFF",
} as const;

export const MAP_INSET_DURATION_MS = 300;

export const MAP_INSET_TRANSITION =
  "duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none";

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}
