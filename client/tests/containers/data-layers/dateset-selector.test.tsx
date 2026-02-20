import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataSet } from "@/app/[locale]/url-store";
import { DATASETS } from "@/containers/data-layers/constants";
import DatasetSelector from "@/containers/data-layers/dataset-selector";

const { mockSetDataSet } = vi.hoisted(() => ({
  mockSetDataSet: vi.fn(),
}));

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useDataSet: () => ({
      dataSet: actual.DataSet.all,
      setDataSet: mockSetDataSet,
    }),
  };
});

describe("@containers/data-layers/dataset-selector", () => {
  afterEach(() => {
    cleanup();
    mockSetDataSet.mockClear();
  });

  it("renders all dataset options", () => {
    render(<DatasetSelector />);
    for (const dataset of DATASETS) {
      expect(screen.getByText(dataset.name)).toBeInTheDocument();
    }
  });

  it("renders a fieldset with an accessible label", () => {
    render(<DatasetSelector />);
    expect(
      screen.getByRole("group", { name: "Dataset filter" }),
    ).toBeInTheDocument();
  });

  it("renders radio inputs for each dataset", () => {
    render(<DatasetSelector />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(DATASETS.length);
  });

  it("checks the radio that matches the current dataset", () => {
    render(<DatasetSelector />);
    const allRadio = screen.getByRole("radio", { name: /All/ });
    expect(allRadio).toBeChecked();

    const otherRadios = screen
      .getAllByRole("radio")
      .filter((r) => r !== allRadio);
    for (const radio of otherRadios) {
      expect(radio).not.toBeChecked();
    }
  });

  it("calls setDataSet when a different dataset is selected", async () => {
    const user = userEvent.setup();
    render(<DatasetSelector />);

    const envRadio = screen.getByRole("radio", { name: /Environment/ });
    await user.click(envRadio);

    expect(mockSetDataSet).toHaveBeenCalledOnce();
    expect(mockSetDataSet).toHaveBeenCalledWith(DataSet.environment);
  });

  it("displays the data layers count for each dataset", () => {
    render(<DatasetSelector />);
    const counts = screen.getAllByText("5 data layers");
    expect(counts).toHaveLength(DATASETS.length);
  });
});
