import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import messages from "@/i18n/messages/en.json";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

vi.mock("@/hooks/use-widget-download", () => ({
  useWidgetDownload: () => ({ download: vi.fn(), loading: false }),
}));

const stats = {
  fsi_avg: 41.2,
  fsi_low_perc: 61.3,
  fsi_moderate_perc: 27.4,
  fsi_high_perc: 11.3,
};

const chart = {
  flood_susceptibility_cog: [
    { key: "fsi_low_perc", value: 61.3 },
    { key: "fsi_moderate_perc", value: 27.4 },
    { key: "fsi_high_perc", value: 11.3 },
  ],
};

const renderWithProviders = (ui: ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>{ui}</TooltipProvider>
    </NextIntlClientProvider>,
  );

const renderFloodSusceptibility = () =>
  renderWithProviders(
    <FloodSusceptibility
      id="flood_susceptibility"
      stats={stats}
      chart={chart}
      layers={[]}
      onInfoButtonClick={vi.fn()}
    />,
  );

describe("@containers/widgets/flood-susceptibility", () => {
  beforeEach(() => {
    (useLayerIds as Mock).mockReturnValue({
      layerIds: [],
      setLayerIds: vi.fn(),
    });
  });

  it("labels the donut slices from the message bundle", () => {
    renderFloodSusceptibility();

    expect(screen.getAllByText("Low risk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Moderate risk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("High risk").length).toBeGreaterThan(0);
  });

  it("takes the donut values from the chart prop", () => {
    renderFloodSusceptibility();

    expect(screen.getByText("Low risk (61.3%)")).toBeInTheDocument();
    expect(screen.getByText("Moderate risk (27.4%)")).toBeInTheDocument();
    expect(screen.getByText("High risk (11.3%)")).toBeInTheDocument();
  });

  it("takes the description figures from the stats prop", () => {
    const { container } = renderFloodSusceptibility();

    expect(container).toHaveTextContent(
      "an average value of 41.2 (0–100) and approximately 61.3% of the area at low risk, 27.4% at moderate risk, and 11.3% at high risk",
    );
  });
});
