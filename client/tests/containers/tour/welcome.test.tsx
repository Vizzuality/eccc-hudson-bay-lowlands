import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MapTour from "@/containers/tour";
import { tourStepIndexAtom } from "@/containers/tour/store";
import Welcome from "@/containers/tour/welcome";
import { COOKIE_NAME } from "@/containers/tour/welcome/constants";
import { useIsMobile } from "@/hooks/use-is-mobile";
import messages from "@/i18n/messages/en.json";

vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: vi.fn(() => false) }));

vi.mock("@/containers/map-sidebar/main/use-main-datasets", () => ({
  useMainDatasets: () => ({ data: [] }),
}));

const mockCookieStore = { set: vi.fn() };

const WELCOME_TITLE = "Explore and analyze the Hudson & James Bay region";

const renderWelcome = ({ withTour = true } = {}) => {
  const store = createStore();
  render(
    <NuqsTestingAdapter>
      <Provider store={store}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <div data-tour="main-sidebar">
            <div data-tour="find-data" />
          </div>
          <Welcome />
          {withTour && <MapTour />}
        </NextIntlClientProvider>
      </Provider>
    </NuqsTestingAdapter>,
  );
  return { store };
};

const expectDismissedCookie = () =>
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    expect.objectContaining({ name: COOKIE_NAME, value: "1", path: "/" }),
  );

describe("@containers/tour/welcome", () => {
  beforeEach(() => {
    vi.stubGlobal("cookieStore", mockCookieStore);
    mockCookieStore.set.mockClear();
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  it("starts the map tour from Start tour and does not show again", async () => {
    const user = userEvent.setup();
    renderWelcome();

    await user.click(screen.getByRole("button", { name: "Start tour" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: WELCOME_TITLE }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expectDismissedCookie();
  });

  it("closes without a tour on Skip for now and does not show again", async () => {
    const user = userEvent.setup();
    const { store } = renderWelcome();

    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(store.get(tourStepIndexAtom)).toBeNull();
    expectDismissedCookie();
  });

  it("does not show again after Escape", async () => {
    const user = userEvent.setup();
    renderWelcome();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expectDismissedCookie();
  });

  it("starts the map tour from the mobile sheet", () => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    const { store } = renderWelcome({ withTour: false });

    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));

    expect(store.get(tourStepIndexAtom)).toBe(0);
    expectDismissedCookie();
  });
});
