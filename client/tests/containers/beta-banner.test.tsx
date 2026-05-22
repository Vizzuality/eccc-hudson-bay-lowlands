import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BetaBanner from "@/containers/beta-banner";
import { COOKIE_NAME } from "@/containers/beta-banner/constants";
import messages from "@/i18n/messages/en.json";

const mockCookieStore = {
  set: vi.fn(),
};

const renderBetaBanner = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BetaBanner />
    </NextIntlClientProvider>,
  );

describe("@containers/beta-banner", () => {
  beforeEach(() => {
    vi.stubGlobal("cookieStore", mockCookieStore);
    mockCookieStore.set.mockClear();
  });

  it("renders the banner with the translated message", () => {
    renderBetaBanner();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/We're in Beta!/)).toBeInTheDocument();
  });

  it("renders a dismiss button with the translated label", () => {
    renderBetaBanner();

    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
  });

  it("collapses the banner when the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderBetaBanner();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    const collapsible = container.querySelector("[data-slot='collapsible']");
    expect(collapsible).toHaveAttribute("data-state", "closed");
  });

  it("sets a cookie via cookieStore when the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    renderBetaBanner();
    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: COOKIE_NAME,
        value: String(now),
        path: "/",
        sameSite: "lax",
      }),
    );

    vi.restoreAllMocks();
  });

  it("removes the banner from the DOM after the dismiss animation", async () => {
    const user = userEvent.setup();
    renderBetaBanner();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(
      () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });
});
