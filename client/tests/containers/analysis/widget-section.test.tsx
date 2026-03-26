import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AnalysisProvider,
  useAnalysisViewportRef,
  useAnalysisWidgetSpy,
} from "@/containers/analysis/analysis-context";
import WidgetSection from "@/containers/analysis/widget-section";

type ObserverOpts = {
  onChange?: (
    isIntersecting: boolean,
    entry: IntersectionObserverEntry,
  ) => void;
  root?: Element | Document | null;
};

const { lastObserverOptions } = vi.hoisted(() => ({
  lastObserverOptions: { current: null as ObserverOpts | null },
}));

vi.mock("usehooks-ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("usehooks-ts")>();
  return {
    ...actual,
    useIntersectionObserver: (opts: ObserverOpts) => {
      lastObserverOptions.current = opts;
      const ref = vi.fn();
      return [ref, false, undefined] as unknown as ReturnType<
        typeof actual.useIntersectionObserver
      >;
    },
  };
});

function makeEntry(): IntersectionObserverEntry {
  return {
    boundingClientRect: { top: 0 } as DOMRectReadOnly,
  } as IntersectionObserverEntry;
}

function ActiveLabel() {
  const { activeWidgetId } = useAnalysisWidgetSpy();
  return <span data-testid="active">{activeWidgetId ?? "none"}</span>;
}

describe("@containers/analysis/widget-section", () => {
  it("reports not intersecting when the scroll root is missing", async () => {
    render(
      <AnalysisProvider>
        <WidgetSection id="no-root">
          <span>no-root</span>
        </WidgetSection>
        <ActiveLabel />
      </AnalysisProvider>,
    );

    const onChange = lastObserverOptions.current?.onChange;
    expect(onChange).toBeDefined();
    if (!onChange) {
      throw new Error("expected onChange from useIntersectionObserver mock");
    }

    act(() => {
      onChange(true, makeEntry());
    });

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("none");
    });
  });

  it("forwards intersection to the analysis registry when scroll root exists", async () => {
    function WithViewport() {
      const viewportRef = useAnalysisViewportRef();
      return (
        <>
          <div ref={viewportRef} data-testid="viewport" />
          <WidgetSection id="tracked">
            <span>tracked</span>
          </WidgetSection>
          <ActiveLabel />
        </>
      );
    }

    render(
      <AnalysisProvider>
        <WithViewport />
      </AnalysisProvider>,
    );

    const onChange = lastObserverOptions.current?.onChange;
    expect(onChange).toBeDefined();
    if (!onChange) {
      throw new Error("expected onChange from useIntersectionObserver mock");
    }

    act(() => {
      onChange(true, makeEntry());
    });

    await waitFor(() => {
      expect(screen.getByTestId("active")).toHaveTextContent("tracked");
    });
  });
});
