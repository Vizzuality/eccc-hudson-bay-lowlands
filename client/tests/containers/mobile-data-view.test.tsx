import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import MobileDataView from "@/containers/mobile-data-view";
import messages from "@/i18n/messages/en.json";
import { TOTAL_LAYER_COUNT } from "@/tests/helpers/mocks";

vi.mock("@/containers/map-sidebar/main", () => ({
  default: ({ header }: { header: React.ReactNode }) => (
    <div data-testid="main">{header}</div>
  ),
}));

vi.mock("@/hooks/use-categories", () => ({
  useCategories: vi.fn(() => ({ totalLayerCount: TOTAL_LAYER_COUNT })),
}));

const renderAt = (searchParams: string) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <MobileDataView />
      </NextIntlClientProvider>
    </NuqsTestingAdapter>,
  );

describe("@containers/mobile-data-view", () => {
  it("renders the data layers with the mobile title when view=data", () => {
    renderAt("?view=data");

    expect(
      screen.getByRole("region", {
        name: `Data Layers (${TOTAL_LAYER_COUNT})`,
      }),
    ).toContainElement(screen.getByTestId("main"));
  });

  it("renders nothing when view=data is left over in analysis mode", () => {
    renderAt("?view=data&mapStatus=analysis");

    expect(screen.queryByTestId("main")).not.toBeInTheDocument();
  });
});
