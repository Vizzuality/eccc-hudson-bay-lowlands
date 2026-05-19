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
  createdAt: string | null;
  setCreatedAt: (date: string | null) => void;
  scrollRoot: HTMLElement | null;
  scrollViewportRef: (el: HTMLDivElement | null) => void;
  activeWidgetId: string | null;
  reportWidgetIntersection: (
    id: string,
    isIntersecting: boolean,
    entry: IntersectionObserverEntry | undefined,
  ) => void;
  shareUrl: string | null;
  setShareUrl: (url: string | null) => void;
  shareDialogOpen: boolean;
  setShareDialogOpen: (open: boolean) => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({
  children,
  initialShareUrl = null,
  initialCreatedAt = null,
}: {
  children: ReactNode;
  initialShareUrl?: string | null;
  initialCreatedAt?: string | null;
}) {
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

  const [shareUrl, setShareUrl] = useState<string | null>(initialShareUrl);
  const [createdAt, setCreatedAt] = useState<string | null>(initialCreatedAt);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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
      shareUrl,
      createdAt,
      setShareUrl,
      setCreatedAt,
      shareDialogOpen,
      setShareDialogOpen,
    }),
    [
      scrollRoot,
      scrollViewportRef,
      activeWidgetId,
      reportWidgetIntersection,
      shareUrl,
      createdAt,
      shareDialogOpen,
    ],
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

export function useAnalysisShare() {
  const {
    createdAt,
    setCreatedAt,
    shareUrl,
    setShareUrl,
    shareDialogOpen,
    setShareDialogOpen,
  } = useAnalysisContext();
  return {
    createdAt,
    setCreatedAt,
    shareUrl,
    setShareUrl,
    shareDialogOpen,
    setShareDialogOpen,
  };
}
