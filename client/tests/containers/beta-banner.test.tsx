import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it } from "vitest";
import BetaBanner from "@/containers/beta-banner";
import messages from "@/i18n/messages/en.json";

const STORAGE_KEY = "beta-banner-dismissed-at";

const renderBetaBanner = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BetaBanner />
    </NextIntlClientProvider>,
  );

describe("@containers/beta-banner", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("hides the banner when dismissed less than 7 days ago", async () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    renderBetaBanner();

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows the banner when dismissed more than 7 days ago", async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(eightDaysAgo));
    renderBetaBanner();

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
