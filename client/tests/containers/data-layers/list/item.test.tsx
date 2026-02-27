import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayers } from "@/app/[locale]/url-store";
import { Accordion } from "@/components/ui/accordion";
import DataLayersListItem, {
  type DataLayersListItemProps,
} from "@/containers/data-layers/list/item";
import messages from "@/i18n/messages/en.json";
import { LAYERS } from "@/tests/helpers/mocks";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayers: vi.fn(),
  };
});

const defaultProps: DataLayersListItemProps = {
  id: 1,
  title: "First Nation Locations",
  description: "Dataset description",
  layers: LAYERS,
  onChange: vi.fn(),
  onLearnMore: vi.fn(),
};

function setupHooks(selectedLayers: number[] = []) {
  (useLayers as Mock).mockReturnValue({
    layers: selectedLayers,
    setLayers: vi.fn(),
  });
}

describe("@containers/data-layers/list/item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderItem = (props: Partial<DataLayersListItemProps> = {}) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Accordion type="multiple">
          <DataLayersListItem {...defaultProps} {...props} />
        </Accordion>
      </NextIntlClientProvider>,
    );

  const expandAccordion = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText(defaultProps.title));
    return user;
  };

  it("renders the dataset title and description", () => {
    setupHooks();
    renderItem();

    expect(screen.getByText("First Nation Locations")).toBeInTheDocument();
    expect(screen.getByText("Dataset description")).toBeInTheDocument();
  });

  it("displays the total layer count", () => {
    setupHooks();
    renderItem();
    expect(screen.getByText("2 layers")).toBeInTheDocument();
  });

  it("uses singular 'layer' when there is only one", () => {
    setupHooks();
    renderItem({ layers: [LAYERS[0]] });
    expect(screen.getByText("1 layer")).toBeInTheDocument();
  });

  it("shows a badge with selected layer count when layers are active", () => {
    setupHooks([10]);
    renderItem();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not show a badge when no layers are selected", () => {
    setupHooks();
    renderItem();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders layer items when the accordion is expanded", async () => {
    setupHooks();
    renderItem();
    await expandAccordion();

    expect(screen.getByText("Layer A")).toBeInTheDocument();
    expect(screen.getByText("Layer B")).toBeInTheDocument();
  });

  it("renders checked checkboxes for selected layers", async () => {
    setupHooks([10]);
    renderItem();
    await expandAccordion();

    expect(screen.getByRole("checkbox", { name: "Layer A" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Layer B" })).not.toBeChecked();
  });

  it("calls onChange with (layerId, true) when selecting a layer", async () => {
    setupHooks();
    const onChange = vi.fn();
    renderItem({ onChange });
    const user = await expandAccordion();

    await user.click(screen.getByRole("checkbox", { name: "Layer A" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(10, true);
  });

  it("calls onChange with (layerId, false) when deselecting a layer", async () => {
    setupHooks([10]);
    const onChange = vi.fn();
    renderItem({ onChange });
    const user = await expandAccordion();

    await user.click(screen.getByRole("checkbox", { name: "Layer A" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(10, false);
  });

  it("calls onLearnMore when the 'Data sources' button is clicked", async () => {
    setupHooks();
    const onLearnMore = vi.fn();
    renderItem({ onLearnMore });
    const user = await expandAccordion();

    await user.click(screen.getByRole("button", { name: /data sources/i }));

    expect(onLearnMore).toHaveBeenCalledOnce();
  });
});
