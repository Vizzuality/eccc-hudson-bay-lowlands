import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  AnalysisProvider,
  useAnalysisScrollRoot,
  useAnalysisViewportRef,
  useAnalysisWidgetSpy,
} from "@/containers/analysis/analysis-context";

function makeEntry(top: number): IntersectionObserverEntry {
  return {
    boundingClientRect: { top } as DOMRectReadOnly,
  } as IntersectionObserverEntry;
}

function useAnalysisHooks() {
  const viewportRef = useAnalysisViewportRef();
  const scrollRoot = useAnalysisScrollRoot();
  const widgetSpy = useAnalysisWidgetSpy();
  return { viewportRef, scrollRoot, ...widgetSpy };
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <AnalysisProvider>{children}</AnalysisProvider>
);

describe("@containers/analysis/analysis-context", () => {
  it("throws when useAnalysisWidgetSpy is used outside AnalysisProvider", () => {
    expect(() => {
      renderHook(() => useAnalysisWidgetSpy());
    }).toThrow("Analysis context is only available inside AnalysisProvider");
  });

  it("updates scrollRoot when the viewport ref callback receives an element", () => {
    const { result } = renderHook(() => useAnalysisHooks(), { wrapper });
    const el = document.createElement("div");

    expect(result.current.scrollRoot).toBeNull();

    act(() => {
      result.current.viewportRef(el);
    });

    expect(result.current.scrollRoot).toBe(el);

    act(() => {
      result.current.viewportRef(null);
    });

    expect(result.current.scrollRoot).toBeNull();
  });

  it("sets activeWidgetId to null when nothing is intersecting", async () => {
    const { result } = renderHook(() => useAnalysisHooks(), { wrapper });

    act(() => {
      result.current.reportWidgetIntersection("w1", true, makeEntry(10));
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBe("w1");
    });

    act(() => {
      result.current.reportWidgetIntersection("w1", false, undefined);
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBeNull();
    });
  });

  it("picks the intersecting widget whose entry has the smallest boundingClientRect.top", async () => {
    const { result } = renderHook(() => useAnalysisHooks(), { wrapper });

    act(() => {
      result.current.reportWidgetIntersection("higher", true, makeEntry(200));
      result.current.reportWidgetIntersection("lower", true, makeEntry(50));
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBe("lower");
    });
  });

  it("recomputes activeWidgetId when intersecting entries change", async () => {
    const { result } = renderHook(() => useAnalysisHooks(), { wrapper });

    act(() => {
      result.current.reportWidgetIntersection("only", true, makeEntry(0));
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBe("only");
    });

    act(() => {
      result.current.reportWidgetIntersection("only", true, makeEntry(300));
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBe("only");
    });
  });

  it("treats a missing observer entry as infinitely far down when comparing widgets", async () => {
    const { result } = renderHook(() => useAnalysisHooks(), { wrapper });

    act(() => {
      result.current.reportWidgetIntersection("no-entry", true, undefined);
      result.current.reportWidgetIntersection("with-entry", true, makeEntry(0));
    });

    await waitFor(() => {
      expect(result.current.activeWidgetId).toBe("with-entry");
    });
  });
});
