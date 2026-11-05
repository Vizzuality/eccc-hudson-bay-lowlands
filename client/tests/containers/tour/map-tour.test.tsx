import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import HelpControl from "@/containers/map/controls/help";
import MapTour from "@/containers/tour";
import { legendOpenAtom, openDatasetIdsAtom } from "@/containers/tour/store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import messages from "@/i18n/messages/en.json";

vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

const datasets = vi.hoisted(() => ({ current: [{ id: 7 }, { id: 9 }] }));
vi.mock("@/containers/map-sidebar/main/use-main-datasets", () => ({
  useMainDatasets: () => ({ data: datasets.current }),
}));

function StartAnalysis() {
  const { setMapStatus } = useMapStatus();
  return (
    <button type="button" onClick={() => setMapStatus(MapStatus.analysis)}>
      Start analysis
    </button>
  );
}

const TARGETS = (
  <>
    <div data-tour="main-sidebar">
      <div data-tour="find-data" />
      <div data-tour="layer-row" />
    </div>
    <div data-map-legend />
    <div data-tour="analyze" />
    <div data-tour="map-controls" />
    <StartAnalysis />
  </>
);

const SCROLLABLE_TARGETS = (
  <div data-tour="main-sidebar">
    <div data-radix-scroll-area-viewport="">
      <div data-tour="find-data" />
    </div>
  </div>
);

const SCROLLABLE_TARGETS_WITHOUT_FIND_DATA = (
  <div data-tour="main-sidebar">
    <div data-radix-scroll-area-viewport="" />
  </div>
);

const renderTour = ({
  searchParams = "",
  targets = TARGETS,
  onUrlUpdate,
}: {
  searchParams?: string;
  targets?: React.ReactNode;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) => {
  const store = createStore();
  const ui = (params: string) => (
    <NuqsTestingAdapter searchParams={params} onUrlUpdate={onUrlUpdate}>
      <Provider store={store}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <TooltipProvider>
            {targets}
            <HelpControl />
            <MapTour />
          </TooltipProvider>
        </NextIntlClientProvider>
      </Provider>
    </NuqsTestingAdapter>
  );
  const result = render(ui(searchParams));
  return {
    ...result,
    store,
    rerenderWith: (params: string) => result.rerender(ui(params)),
  };
};

const startTour = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Help" }));

const clickNext = async (
  user: ReturnType<typeof userEvent.setup>,
  times = 1,
) => {
  for (let i = 0; i < times; i++) {
    await user.click(screen.getByRole("button", { name: "Next" }));
  }
};

describe("@containers/tour", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    datasets.current = [{ id: 7 }, { id: 9 }];
  });

  it("walks forward and back through the steps", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Find the data you need" }),
    ).toBeInTheDocument();

    await clickNext(user);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on the close button", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);
    await user.click(screen.getByRole("button", { name: "Close tour" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes after Start exploring on the last step", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);
    await clickNext(user, 4);
    expect(
      screen.getByRole("heading", { name: "You’re all set" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start exploring" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the first dataset when entering Add layers", async () => {
    const user = userEvent.setup();
    const { store } = renderTour();

    await startTour(user);
    await clickNext(user);

    expect(store.get(openDatasetIdsAtom)).toEqual(["7"]);
  });

  it("adds the default layer on Control layers when the map has none", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const { store } = renderTour({ searchParams: "?layers=", onUrlUpdate });

    await startTour(user);
    await clickNext(user, 2);

    expect(onUrlUpdate).toHaveBeenCalledOnce();
    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.has("layers")).toBe(
      false,
    );
    expect(store.get(legendOpenAtom)).toBe(true);
  });

  it("keeps the user's layers on Control layers when the map has some", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderTour({ searchParams: "?layers=flood", onUrlUpdate });

    await startTour(user);
    await clickNext(user, 2);

    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("shows the card without a spotlight when the target is missing", async () => {
    const user = userEvent.setup();
    renderTour({ targets: <div data-tour="map-controls" /> });

    await startTour(user);
    expect(
      screen.getByRole("heading", { name: "Find the data you need" }),
    ).toBeInTheDocument();

    await clickNext(user);
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  it("closes when the viewport becomes mobile", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderTour();

    await startTour(user);
    vi.mocked(useIsMobile).mockReturnValue(true);
    rerenderWith("");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides the help button outside the default map status", () => {
    renderTour({ searchParams: "?mapStatus=analysis" });

    expect(
      screen.queryByRole("button", { name: "Help" }),
    ).not.toBeInTheDocument();
  });

  it("closes when the map leaves the default status", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);
    fireEvent.click(
      screen.getByRole("button", { name: "Start analysis", hidden: true }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps focus where the user moved it when the tour re-renders", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderTour();

    await startTour(user);
    const next = screen.getByRole("button", { name: "Next" });
    next.focus();
    rerenderWith("");

    expect(next).toHaveFocus();
  });

  it("treats a target with no size as missing", async () => {
    const user = userEvent.setup();
    renderTour();

    await startTour(user);

    expect(screen.getByRole("dialog").querySelector("polygon")).toBeNull();
  });

  it("points at a target that has a size", async () => {
    const user = userEvent.setup();
    renderTour();
    setRect(document.querySelector('[data-tour="find-data"]'), {
      top: 100,
      height: 50,
    });

    await startTour(user);

    await waitFor(() =>
      expect(
        screen.getByRole("dialog").querySelector("polygon"),
      ).not.toBeNull(),
    );
  });

  it("scrolls the sidebar scroll area without scrollIntoView", async () => {
    const user = userEvent.setup();
    vi.mocked(HTMLElement.prototype.scrollIntoView).mockClear();
    renderTour({ targets: SCROLLABLE_TARGETS });
    const viewport = mountScrollArea();
    setRect(document.querySelector('[data-tour="find-data"]'), {
      top: 700,
      height: 50,
    });

    await startTour(user);

    await waitFor(() => expect(viewport.scrollTop).toBe(325));
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls to a target that appears after the step starts", async () => {
    const user = userEvent.setup();
    renderTour({ targets: SCROLLABLE_TARGETS_WITHOUT_FIND_DATA });
    const viewport = mountScrollArea();

    await startTour(user);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const late = document.createElement("div");
    late.setAttribute("data-tour", "find-data");
    setRect(late, { top: 700, height: 50 });
    viewport.appendChild(late);

    await waitFor(() => expect(viewport.scrollTop).toBe(325));
  });
});

function setRect(
  element: Element | null,
  { top, height }: { top: number; height: number },
) {
  if (!element) throw new Error("target not found");
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    top,
    height,
    left: 0,
    width: 100,
  } as DOMRect);
}

function mountScrollArea() {
  const viewport = document.querySelector<HTMLElement>(
    "[data-radix-scroll-area-viewport]",
  );
  if (!viewport) throw new Error("scroll area not found");
  Object.defineProperty(viewport, "scrollTop", { value: 0, writable: true });
  vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
    top: 0,
    height: 800,
    left: 0,
    width: 400,
  } as DOMRect);
  return viewport;
}
