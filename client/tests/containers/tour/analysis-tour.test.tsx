import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import HelpControl from "@/containers/map/controls/help";
import MapTour from "@/containers/tour";
import AnalysisTour from "@/containers/tour/analysis-tour";
import { useIsMobile } from "@/hooks/use-is-mobile";
import messages from "@/i18n/messages/en.json";

vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

vi.mock("@/containers/map-sidebar/main/use-main-datasets", () => ({
  useMainDatasets: () => ({ data: [] }),
}));

function CloseAnalysis() {
  const { setMapStatus } = useMapStatus();
  return (
    <button type="button" onClick={() => setMapStatus(MapStatus.default)}>
      Close analysis
    </button>
  );
}

const renderTours = (searchParams = "?mapStatus=analysis") => {
  const ui = (
    <NuqsTestingAdapter searchParams={searchParams}>
      <Provider store={createStore()}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <TooltipProvider>
            <CloseAnalysis />
            <HelpControl />
            <MapTour />
            <AnalysisTour />
          </TooltipProvider>
        </NextIntlClientProvider>
      </Provider>
    </NuqsTestingAdapter>
  );
  return render(ui);
};

const nudge = () =>
  screen.queryByRole("button", { name: "Need help with the analysis?" });

describe("@containers/tour analysis tour", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    localStorage.clear();
  });

  it("starts the analysis tour from Help during an analysis and ends on Got it", async () => {
    const user = userEvent.setup();
    renderTours();

    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Your analysis, one topic at a time",
      }),
    ).toBeInTheDocument();

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(
      screen.getByRole("heading", { name: "That’s it" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts the map tour from Help outside an analysis", async () => {
    const user = userEvent.setup();
    renderTours("");

    await user.click(screen.getByRole("button", { name: "Help" }));

    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(nudge()).not.toBeInTheDocument();
  });

  it("starts the tour from the nudge and does not show the nudge again", async () => {
    const user = userEvent.setup();
    const { unmount } = renderTours();

    const button = nudge();
    if (!button) throw new Error("nudge not shown");
    await user.click(button);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    unmount();

    renderTours();
    expect(nudge()).not.toBeInTheDocument();
  });

  it("keeps the nudge hidden after the user dismisses it", async () => {
    const user = userEvent.setup();
    const { unmount } = renderTours();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(nudge()).not.toBeInTheDocument();
    unmount();

    renderTours();
    expect(nudge()).not.toBeInTheDocument();
  });

  it("closes when the analysis closes", async () => {
    const user = userEvent.setup();
    renderTours();

    await user.click(screen.getByRole("button", { name: "Help" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Close analysis", hidden: true }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
