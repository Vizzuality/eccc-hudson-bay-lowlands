import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  { name: "CarbonPeatland", Component: CarbonPeatland },
  { name: "WaterDynamics", Component: WaterDynamics },
  { name: "FloodSusceptibility", Component: FloodSusceptibility },
  { name: "SnowDynamics", Component: SnowDynamics },
  { name: "TreeCoverChange", Component: TreeCoverChange },
  { name: "EcosystemTypes", Component: EcosystemTypes },
] as const;

describe("@containers/widgets", () => {
  it.each(widgetCardComponents)(
    "$name invokes WidgetCard action handlers when buttons are clicked",
    async ({ Component }) => {
      const user = userEvent.setup();
      renderWithProviders(<Component />);

      await user.click(screen.getByRole("button", { name: /download image/i }));
      await user.click(screen.getByRole("button", { name: /more info/i }));
      await user.click(screen.getByRole("button", { name: /add to map/i }));
    },
  );

  it("renders ShareWidget", () => {
    renderWithProviders(<ShareWidget />);

    expect(
      screen.getByRole("button", { name: messages.widgets.share.title }),
    ).toBeInTheDocument();
  });
});
