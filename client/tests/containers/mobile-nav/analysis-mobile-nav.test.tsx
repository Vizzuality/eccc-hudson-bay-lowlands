import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { AnalysisMobileNav } from "@/containers/mobile-nav/analysis-mobile-nav";
import messages from "@/i18n/messages/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const renderAt = (searchParams: string, onUrlUpdate?: OnUrlUpdateFunction) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <AnalysisMobileNav />
      </NextIntlClientProvider>
    </NuqsTestingAdapter>,
  );

describe("@containers/mobile-nav/analysis-mobile-nav", () => {
  it("clears the view when Map is tapped from the results", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderAt("?mapStatus=analysis&view=results", onUrlUpdate);

    await user.click(screen.getByRole("button", { name: "Map" }));

    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.has("view")).toBe(false);
  });

  it("sets view=data when Data is tapped from the results", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderAt("?mapStatus=analysis&view=results", onUrlUpdate);

    await user.click(screen.getByRole("button", { name: "Data" }));

    expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get("view")).toBe(
      "data",
    );
  });

  it("opens the leave dialog when the close button is tapped", async () => {
    const user = userEvent.setup();
    renderAt("?mapStatus=analysis&view=results");

    await user.click(screen.getByRole("button", { name: /leave analysis/i }));

    expect(
      screen.getByRole("dialog", { name: /leave current analysis/i }),
    ).toBeInTheDocument();
  });
});
