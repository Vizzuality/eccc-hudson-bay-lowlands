import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AnalysisProvider,
  useAnalysisWidgetSpy,
} from "@/containers/analysis/analysis-context";
import AnalysisNavigation from "@/containers/analysis/navigation";

vi.mock("@/hooks/use-widgets", () => ({
  useWidgets: () => [
    { id: "alpha", title: "Alpha" },
    { id: "beta", title: "Beta" },
  ],
}));

function makeEntry(top: number): IntersectionObserverEntry {
  return {
    boundingClientRect: { top } as DOMRectReadOnly,
  } as IntersectionObserverEntry;
}

function Harness() {
  const { reportWidgetIntersection } = useAnalysisWidgetSpy();
  return (
    <>
      <AnalysisNavigation />
      <button
        type="button"
        onClick={() => reportWidgetIntersection("alpha", true, makeEntry(0))}
      >
        activate-alpha
      </button>
    </>
  );
}

describe("@containers/analysis/navigation", () => {
  it("scrolls the active nav chip into view when the active widget changes", async () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, "scrollIntoView");

    render(
      <AnalysisProvider>
        <Harness />
      </AnalysisProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "activate-alpha" }),
    );

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  });

  it("scrolls the target widget into view when its nav button is clicked", async () => {
    const user = userEvent.setup();
    const target = document.createElement("div");
    target.id = "alpha";
    document.body.appendChild(target);

    const scrollSpy = vi.spyOn(target, "scrollIntoView");

    render(
      <AnalysisProvider>
        <AnalysisNavigation />
      </AnalysisProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Alpha" }));

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    target.remove();
  });
});
