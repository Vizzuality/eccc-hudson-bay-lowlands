import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DataLayersList from "@/containers/data-layers/list";
import messages from "@/i18n/messages/en.json";
import { DATA_LAYERS } from "@/tests/helpers/mocks";
import type { NormalizedDataset } from "@/types";

const capturedItemProps: Record<string, unknown>[] = [];

vi.mock("@/containers/data-layers/list/item", () => ({
  default: (props: Record<string, unknown>) => {
    capturedItemProps.push(props);
    return (
      <div data-testid={`dataset-item-${props.id}`}>
        <button type="button" onClick={props.onLearnMore as () => void}>
          Learn more mock
        </button>
      </div>
    );
  },
}));

describe("@containers/data-layers/list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedItemProps.length = 0;
  });

  const renderList = (
    props: Partial<{
      datasets: NormalizedDataset[];
      isLoading: boolean;
      onItemChange: (id: number, isSelected: boolean) => void;
    }> = {},
  ) => {
    const merged = {
      datasets: DATA_LAYERS,
      isLoading: false,
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

  it("renders the skeleton while loading", () => {
    renderList({ isLoading: true });

    expect(
      screen.getByRole("region", {
        name: /data layers list skeleton/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Data layers list" }),
    ).not.toBeInTheDocument();
  });

  it("displays the dataset count in the title", () => {
    renderList();
    expect(
      screen.getByText(`All data (${DATA_LAYERS.length})`),
    ).toBeInTheDocument();
  });

  it("renders one item per dataset", () => {
    renderList();
    for (const dataset of DATA_LAYERS) {
      expect(
        screen.getByTestId(`dataset-item-${dataset.id}`),
      ).toBeInTheDocument();
    }
  });

  it("passes correct props to each dataset item", () => {
    const onItemChange = vi.fn();
    renderList({ onItemChange });

    expect(capturedItemProps).toHaveLength(DATA_LAYERS.length);
    for (let i = 0; i < DATA_LAYERS.length; i++) {
      expect(capturedItemProps[i]).toMatchObject({
        id: DATA_LAYERS[i].id,
        title: DATA_LAYERS[i].metadata.title,
        description: DATA_LAYERS[i].metadata.description,
        layers: [],
      });
      expect(capturedItemProps[i].onChange).toBeTypeOf("function");
      expect(capturedItemProps[i].onLearnMore).toBeTypeOf("function");
    }
  });

  it("forwards onItemChange to each item's onChange", () => {
    const onItemChange = vi.fn();
    renderList({ onItemChange });

    const onChange = capturedItemProps[0].onChange as (
      id: number,
      isSelected: boolean,
    ) => void;
    onChange(10, true);

    expect(onItemChange).toHaveBeenCalledWith(10, true);
  });

  it("renders an empty list when no datasets are provided", () => {
    renderList({ datasets: [] });
    expect(screen.queryAllByTestId(/dataset-item/)).toHaveLength(0);
    expect(screen.getByText("All data (0)")).toBeInTheDocument();
  });

  it("opens the dialog when onLearnMore is triggered from an item", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getAllByText("Learn more mock")[0]);

    expect(
      screen.getByRole("dialog", { name: /data layer details/i }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when OK is clicked", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getAllByText("Learn more mock")[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /ok/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
