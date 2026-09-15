import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import WaterDynamics from "@/containers/widgets/water-dynamics";
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
  water_perm_perc: 11.1,
  water_ephemeral_perc: 22.2,
  land_perm_perc: 66.7,
  freq_mean: 33.3,
  trend_wetter_perc: 44.4,
  trend_drier_perc: 5.5,
  trend_stable_perc: 50.1,
};

const chart = {
  inundation_frequency_cog: [
    { key: "water_perm_perc", value: 11.1 },
    { key: "water_ephemeral_perc", value: 22.2 },
    { key: "land_perm_perc", value: 66.7 },
  ],
};

const renderWithProviders = (ui: ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>{ui}</TooltipProvider>
    </NextIntlClientProvider>,
  );

const renderWaterDynamics = () =>
  renderWithProviders(
    <WaterDynamics
      id="water_dynamics"
      unit="%"
      stats={stats}
      chart={chart}
      layers={[]}
      onInfoButtonClick={vi.fn()}
    />,
  );

describe("@containers/widgets/water-dynamics", () => {
  beforeEach(() => {
    (useLayerIds as Mock).mockReturnValue({
      layerIds: [],
      setLayerIds: vi.fn(),
    });
  });

  it("labels the donut slices from the message bundle", () => {
    renderWaterDynamics();

    expect(screen.getAllByText("Permanent water").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ephemeral water").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Permanently dry land").length).toBeGreaterThan(
      0,
    );
  });

  it("takes the donut values from the chart prop", () => {
    renderWaterDynamics();

    expect(screen.getByText("Permanent water (11.1%)")).toBeInTheDocument();
    expect(screen.getByText("Ephemeral water (22.2%)")).toBeInTheDocument();
    expect(
      screen.getByText("Permanently dry land (66.7%)"),
    ).toBeInTheDocument();
  });

  it("takes the description figures from the stats prop", () => {
    const { container } = renderWaterDynamics();

    expect(container).toHaveTextContent(
      "11.1% of the area is permanent water, 22.2% is ephemeral water, and 66.7% is permanently dry land, with a mean inundation frequency of 33.3%",
    );
  });
});
