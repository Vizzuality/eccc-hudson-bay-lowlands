import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { WidgetLayer } from "@/containers/analysis/types";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import messages from "@/i18n/messages/en.json";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

const defaultCardProps: ComponentProps<typeof WidgetCard> = {
  id: "test_widget",
  title: "Test widget",
  icon: <span />,
  onDowloadButtonClick: vi.fn(),
  onInfoButtonClick: vi.fn(),
  onAddToMapButtonClick: vi.fn(),
};

const renderWidgetCard = (
  overrides?: Partial<ComponentProps<typeof WidgetCard>>,
) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>
        <WidgetCard {...defaultCardProps} {...overrides} />
      </TooltipProvider>
    </NextIntlClientProvider>,
  );

const testLayers: WidgetLayer[] = [
  { id: "new-layer-a", path: "/a", title: { en: "A", fr: "A" } },
  { id: "new-layer-b", path: "/b", title: { en: "B", fr: "B" } },
];

describe("@containers/widgets/card", () => {
  let setLayerIdsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setLayerIdsMock = vi.fn();
    (useLayerIds as Mock).mockReturnValue({
      layerIds: ["base-layer"],
      setLayerIds: setLayerIdsMock,
    });
  });

  it("renders title, optional description, icon, and children", () => {
    renderWidgetCard({
      title: "Water dynamics",
      description: <span>Some description</span>,
      icon: <span data-testid="widget-icon">ICON</span>,
      children: <div>Child content</div>,
    });

    expect(
      screen.getByRole("heading", { name: /water dynamics/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/some description/i)).toBeInTheDocument();
    expect(screen.getByTestId("widget-icon")).toBeInTheDocument();
    expect(screen.getByText(/child content/i)).toBeInTheDocument();
  });

  it("does not render the description when not provided", () => {
    renderWidgetCard({ title: "Flood susceptibility" });

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

    renderWidgetCard({
      onDowloadButtonClick,
      onInfoButtonClick,
      onAddToMapButtonClick,
    });

    await user.click(screen.getByRole("button", { name: /download image/i }));
    await user.click(screen.getByRole("button", { name: /more info/i }));
    await user.click(screen.getByRole("button", { name: /add to map/i }));

    expect(onDowloadButtonClick).toHaveBeenCalledTimes(1);
    expect(onInfoButtonClick).toHaveBeenCalledTimes(1);
    expect(onAddToMapButtonClick).toHaveBeenCalledTimes(1);
  });

  it("merges widget layer ids into the map layer stack when none of them are active", async () => {
    const user = userEvent.setup();
    const onAddToMapButtonClick = vi.fn();

    renderWidgetCard({ layers: testLayers, onAddToMapButtonClick });

    await user.click(screen.getByRole("button", { name: /add to map/i }));

    expect(onAddToMapButtonClick).not.toHaveBeenCalled();
    expect(setLayerIdsMock).toHaveBeenCalledWith([
      "base-layer",
      "new-layer-a",
      "new-layer-b",
    ]);
  });

  it("removes widget layer ids from the map when any of them are active", async () => {
    const user = userEvent.setup();
    const onAddToMapButtonClick = vi.fn();
    (useLayerIds as Mock).mockReturnValue({
      layerIds: ["base-layer", "new-layer-a", "new-layer-b", "other"],
      setLayerIds: setLayerIdsMock,
    });

    renderWidgetCard({ layers: testLayers, onAddToMapButtonClick });

    await user.click(screen.getByRole("button", { name: /add to map/i }));

    expect(onAddToMapButtonClick).not.toHaveBeenCalled();
    expect(setLayerIdsMock).toHaveBeenCalledWith(["base-layer", "other"]);
  });

  it("disables add to map when layers is an empty array", () => {
    renderWidgetCard({ layers: [] });

    expect(screen.getByRole("button", { name: /add to map/i })).toBeDisabled();
  });

  it("renders WidgetCardIcon with a gradient using the provided backgroundColor", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TooltipProvider>
          <WidgetCardIcon
            icon={<span data-testid="inner-icon" />}
            backgroundColor="rgb(255, 0, 0)"
          />
        </TooltipProvider>
      </NextIntlClientProvider>,
    );

    const iconEl = screen.getByTestId("inner-icon");
    const wrapper = iconEl.parentElement;
    expect(wrapper).not.toBeNull();
    const styleAttr = wrapper?.getAttribute("style") ?? "";
    expect(styleAttr).toContain("linear-gradient");
    expect(styleAttr).toContain("rgb(255, 0, 0)");
  });
});
