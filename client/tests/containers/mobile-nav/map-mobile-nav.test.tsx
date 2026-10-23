import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { MapMobileNav } from "@/containers/mobile-nav/map-mobile-nav";
import messages from "@/i18n/messages/en.json";

describe("@containers/mobile-nav/map-mobile-nav", () => {
  it("enters upload mode and clears the view when Analysis is tapped from the data view", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    render(
      <NuqsTestingAdapter searchParams="?view=data" onUrlUpdate={onUrlUpdate}>
        <NextIntlClientProvider locale="en" messages={messages}>
          <MapMobileNav />
        </NextIntlClientProvider>
      </NuqsTestingAdapter>,
    );

    await user.click(screen.getByRole("button", { name: "Analysis" }));

    const searchParams = onUrlUpdate.mock.lastCall?.[0].searchParams;
    expect(searchParams?.get("mapStatus")).toBe("upload");
    expect(searchParams?.has("view")).toBe(false);
  });
});
