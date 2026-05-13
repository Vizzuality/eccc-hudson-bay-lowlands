import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { mockAnalysisResult } from "@/containers/map-sidebar/analysis/mockData";
import CarbonPeatland from "@/containers/widgets/carbon-peatland";
import EcosystemTypes from "@/containers/widgets/ecosystem-types";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import ShareWidget from "@/containers/widgets/share";
import SnowDynamics from "@/containers/widgets/snow-dynamics";
import TreeCoverChange from "@/containers/widgets/tree-cover-change";
import WaterDynamics from "@/containers/widgets/water-dynamics";
import messages from "@/i18n/messages/en.json";
import type { Layer } from "@/types";

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

const testWidgetLayers: Layer[] = [
  {
    id: "analysis.test.layer",
    format: "cog",
    type: "raster",
    path: "",
    unit: "",
    categories: null,
    metadata: {
      title: { en: "Test layer", fr: "Couche test" },
      description: { en: "", fr: "" },
    },
    dataset_id: 1,
    config: null,
  },
];

const renderWithProviders = (ui: ReactElement) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>{ui}</TooltipProvider>
    </NextIntlClientProvider>,
  );

const widgetCardComponents = [
  {
    name: "CarbonPeatland",
    element: (
      <CarbonPeatland
        id="peat_carbon"
        stats={mockAnalysisResult.peat_carbon.stats}
        chart={mockAnalysisResult.peat_carbon.chart}
        layers={testWidgetLayers}
      />
    ),
  },
  {
    name: "WaterDynamics",
    element: (
      <WaterDynamics
        id="water_dynamics"
        unit={mockAnalysisResult.water_dynamics.unit}
        stats={mockAnalysisResult.water_dynamics.stats}
        layers={testWidgetLayers}
      />
    ),
  },
  {
    name: "FloodSusceptibility",
    element: (
      <FloodSusceptibility
        id="flood_susceptibility"
        stats={mockAnalysisResult.flood_susceptibility.stats}
        layers={testWidgetLayers}
      />
    ),
  },
  {
    name: "SnowDynamics",
    element: (
      <SnowDynamics
        id="snow_dynamics"
        stats={mockAnalysisResult.snow_dynamics.stats}
        chart={mockAnalysisResult.snow_dynamics.chart ?? {}}
        layers={testWidgetLayers}
      />
    ),
  },
  {
    name: "TreeCoverChange",
    element: (
      <TreeCoverChange
        id="treed_area"
        stats={mockAnalysisResult.treed_area.stats}
        layers={testWidgetLayers}
      />
    ),
  },
  {
    name: "EcosystemTypes",
    element: (
      <EcosystemTypes
        id="ecosystem_classification"
        stats={mockAnalysisResult.ecosystem_classification.stats}
        layers={testWidgetLayers}
      />
    ),
  },
] as const;

describe("@containers/widgets", () => {
  beforeEach(() => {
    (useLayerIds as Mock).mockReturnValue({
      layerIds: ["nativeland.4pgB_next_nld_terr_prod_layer"],
      setLayerIds: vi.fn(),
    });
  });

  it.each(widgetCardComponents)(
    "$name invokes WidgetCard action handlers when buttons are clicked",
    async ({ element }) => {
      const user = userEvent.setup();
      renderWithProviders(element);

      await user.click(screen.getByRole("button", { name: /download image/i }));
      await user.click(screen.getByRole("button", { name: /more info/i }));
      await user.click(screen.getByRole("button", { name: /add to map/i }));
    },
  );

  it("renders ShareWidget", () => {
    renderWithProviders(<ShareWidget />);

    expect(
      screen.getByRole("button", { name: messages.share.title }),
    ).toBeInTheDocument();
  });
});
