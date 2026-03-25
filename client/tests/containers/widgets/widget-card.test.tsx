import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";

describe("@containers/widgets/card", () => {
  it("renders title, optional description, icon, and children", () => {
    render(
      <TooltipProvider>
        <WidgetCard
          title="Water dynamics"
          description={<span>Some description</span>}
          icon={<span data-testid="widget-icon">ICON</span>}
          onDowloadButtonClick={vi.fn()}
          onInfoButtonClick={vi.fn()}
          onAddToMapButtonClick={vi.fn()}
        >
          <div>Child content</div>
        </WidgetCard>
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /water dynamics/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/some description/i)).toBeInTheDocument();
    expect(screen.getByTestId("widget-icon")).toBeInTheDocument();
    expect(screen.getByText(/child content/i)).toBeInTheDocument();
  });

  it("does not render the description when not provided", () => {
    render(
      <TooltipProvider>
        <WidgetCard
          title="Flood susceptibility"
          icon={<span />}
          onDowloadButtonClick={vi.fn()}
          onInfoButtonClick={vi.fn()}
          onAddToMapButtonClick={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /flood susceptibility/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/more info/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download image/i }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: /add to map/i })).toBeEnabled();
  });

  it("fires callbacks when the action buttons are clicked", async () => {
    const user = userEvent.setup();
    const onDowloadButtonClick = vi.fn();
    const onInfoButtonClick = vi.fn();
    const onAddToMapButtonClick = vi.fn();

    render(
      <TooltipProvider>
        <WidgetCard
          title="Tree cover change"
          icon={<span />}
          onDowloadButtonClick={onDowloadButtonClick}
          onInfoButtonClick={onInfoButtonClick}
          onAddToMapButtonClick={onAddToMapButtonClick}
        />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole("button", { name: /download image/i }));
    await user.click(screen.getByRole("button", { name: /more info/i }));
    await user.click(screen.getByRole("button", { name: /add to map/i }));

    expect(onDowloadButtonClick).toHaveBeenCalledTimes(1);
    expect(onInfoButtonClick).toHaveBeenCalledTimes(1);
    expect(onAddToMapButtonClick).toHaveBeenCalledTimes(1);
  });

  it("renders WidgetCardIcon with a gradient using the provided backgroundColor", () => {
    render(
      <TooltipProvider>
        <WidgetCardIcon
          icon={<span data-testid="inner-icon" />}
          backgroundColor="rgb(255, 0, 0)"
        />
      </TooltipProvider>,
    );

    const iconEl = screen.getByTestId("inner-icon");
    const wrapper = iconEl.parentElement;
    expect(wrapper).not.toBeNull();
    const styleAttr = wrapper?.getAttribute("style") ?? "";
    expect(styleAttr).toContain("linear-gradient");
    expect(styleAttr).toContain("rgb(255, 0, 0)");
  });
});
