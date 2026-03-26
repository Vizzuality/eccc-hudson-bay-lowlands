"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AnalysisContextValue = {
  scrollRoot: HTMLElement | null;
  scrollViewportRef: (el: HTMLDivElement | null) => void;
  activeWidgetId: string | null;
  reportWidgetIntersection: (
    id: string,
    isIntersecting: boolean,
    entry: IntersectionObserverEntry | undefined,
  ) => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const scrollViewportRef = useCallback((el: HTMLDivElement | null) => {
    setScrollRoot(el);
  }, []);

  const [registry, setRegistry] = useState<
    Record<
      string,
      { isIntersecting: boolean; entry: IntersectionObserverEntry | undefined }
    >
  >({});

  const reportWidgetIntersection = useCallback(
    (
      id: string,
      isIntersecting: boolean,
      entry: IntersectionObserverEntry | undefined,
    ) => {
      setRegistry((prev) => {
        const next = { ...prev };
        if (isIntersecting) {
          next[id] = { isIntersecting: true, entry };
        } else {
          delete next[id];
        }
        return next;
      });
    },
    [],
  );

  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);

  useEffect(() => {
    const intersecting = Object.entries(registry).filter(
      ([, v]) => v.isIntersecting,
    );
    if (intersecting.length === 0) {
      setActiveWidgetId(null);
      return;
    }
    const [bestId] = intersecting.reduce((best, curr) => {
      const top = curr[1].entry?.boundingClientRect.top ?? Infinity;
      const bestTop = best[1].entry?.boundingClientRect.top ?? Infinity;
      return top < bestTop ? curr : best;
    }, intersecting[0]);
    setActiveWidgetId(bestId);
  }, [registry]);

  const value = useMemo<AnalysisContextValue>(
    () => ({
      scrollRoot,
      scrollViewportRef,
      activeWidgetId,
      reportWidgetIntersection,
    }),
    [scrollRoot, scrollViewportRef, activeWidgetId, reportWidgetIntersection],
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

function useAnalysisContext() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error(
      "Analysis context is only available inside AnalysisProvider",
    );
  }
  return ctx;
}

/** Scroll viewport element used as IntersectionObserver root for widget sections. */
export function useAnalysisScrollRoot() {
  return useAnalysisContext().scrollRoot;
}

/** Attach to `ScrollArea`’s viewport so scroll-root state stays in sync. */
export function useAnalysisViewportRef() {
  return useAnalysisContext().scrollViewportRef;
}

export function useAnalysisWidgetSpy() {
  const { activeWidgetId, reportWidgetIntersection } = useAnalysisContext();
  return { activeWidgetId, reportWidgetIntersection };
}
