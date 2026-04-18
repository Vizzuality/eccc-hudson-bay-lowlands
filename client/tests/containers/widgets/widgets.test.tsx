import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
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
      />
    ),
  },
  {
    name: "FloodSusceptibility",
    element: (
      <FloodSusceptibility
        id="flood_susceptibility"
        stats={mockAnalysisResult.flood_susceptibility.stats}
      />
    ),
  },
  {
    name: "SnowDynamics",
    element: (
      <SnowDynamics
        id="snow_dynamics"
        stats={mockAnalysisResult.snow_dynamics.stats}
      />
    ),
  },
  {
    name: "TreeCoverChange",
    element: (
      <TreeCoverChange
        id="tree_cover_change"
        stats={mockAnalysisResult.tree_cover_change.stats}
      />
    ),
  },
  {
    name: "EcosystemTypes",
    element: (
      <EcosystemTypes
        id="ecosystem_types"
        stats={mockAnalysisResult.ecosystem_types.stats}
      />
    ),
  },
] as const;

describe("@containers/widgets", () => {
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
