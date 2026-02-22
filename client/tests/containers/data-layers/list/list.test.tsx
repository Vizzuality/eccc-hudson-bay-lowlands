import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import DataLayersList from "@/containers/data-layers/list";
import messages from "@/i18n/messages/en.json";
import { DATA_LAYERS } from "@/tests/helpers/mocks";
import type { DataLayer } from "@/types";

describe("@containers/data-layers/list", () => {
  const renderList = (
    props: Partial<{
      items: DataLayer[];
      layers: string[];
      onItemChange: (id: string, isSelected: boolean) => void;
    }> = {},
  ) => {
    const merged = {
      items: DATA_LAYERS,
      layers: [] as string[],
      onItemChange: vi.fn(),
      ...props,
    };
    return {
      ...render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <DataLayersList {...merged} />
        </NextIntlClientProvider>,
      ),
      onItemChange: merged.onItemChange,
    };
  };

  it("renders the section with an accessible label", () => {
    renderList();
    expect(
      screen.getByRole("region", { name: /data layers list/i }),
    ).toBeInTheDocument();
  });

  it("displays the item count in the title", () => {
    renderList();
    expect(
      screen.getByText(`All data (${DATA_LAYERS.length})`),
    ).toBeInTheDocument();
  });

  it("renders a checkbox for each item", () => {
    renderList();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(DATA_LAYERS.length);
  });

  it("marks selected layers as checked", () => {
    renderList({ layers: ["layer-1", "layer-3"] });

    expect(
      screen.getByRole("checkbox", { name: "First Nation Locations" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Caribou Ranges" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Wetland Areas" }),
    ).toBeChecked();
  });

  it("calls onItemChange when a layer checkbox is toggled", async () => {
    const user = userEvent.setup();
    const { onItemChange } = renderList();

    await user.click(screen.getByRole("checkbox", { name: "Caribou Ranges" }));

    expect(onItemChange).toHaveBeenCalledOnce();
    expect(onItemChange).toHaveBeenCalledWith("layer-2", true);
  });

  it("renders an empty list when no items are provided", () => {
    renderList({ items: [] });
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByText("All data (0)")).toBeInTheDocument();
  });

  it("opens the dialog when 'Learn more' is clicked", async () => {
    const user = userEvent.setup();
    renderList();

    const learnMoreButtons = screen.getAllByRole("button", {
      name: /learn more/i,
    });
    await user.click(learnMoreButtons[0]);

    expect(
      screen.getByRole("dialog", { name: /data layer details/i }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when OK is clicked", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getAllByRole("button", { name: /learn more/i })[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /ok/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
