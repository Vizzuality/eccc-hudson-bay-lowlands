import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import MoreInfoTooltip from "@/containers/more-info-tooltip";

describe("@containers/more-info-tooltip", () => {
  it("renders the title on the trigger button", () => {
    render(
      <TooltipProvider>
        <MoreInfoTooltip title="Learn more">
          <p>Extra details</p>
        </MoreInfoTooltip>
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("button", { name: /learn more/i }),
    ).toBeInTheDocument();
  });

  it("shows children in the tooltip on hover", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <MoreInfoTooltip title="More info">
          <span>Tooltip body content</span>
        </MoreInfoTooltip>
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole("button", { name: /more info/i }));

    // Radix duplicates tooltip content for the accessible description; match any instance.
    expect(await screen.findAllByText("Tooltip body content")).not.toHaveLength(
      0,
    );
  });
});
