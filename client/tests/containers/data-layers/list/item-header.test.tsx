import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import ItemHeader from "@/containers/data-layers/list/item/item-header";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

describe("@containers/data-layers/list/item/item-header", () => {
  let setLayerIdsMock: Mock;

  const setupHooks = (selectedLayerIds: string[] = []) => {
    setLayerIdsMock = vi.fn();
    (useLayerIds as Mock).mockReturnValue({
      layerIds: selectedLayerIds,
      setLayerIds: setLayerIdsMock,
    });
  };

  const renderHeader = () =>
    render(
      <ItemHeader id="10" title="Layer A" description="Layer A description" />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and description", () => {
    setupHooks();
    renderHeader();

    expect(screen.getByText("Layer A")).toBeInTheDocument();
    expect(screen.getByText("Layer A description")).toBeInTheDocument();
  });

  it("renders an unchecked checkbox when the layer is not selected", () => {
    setupHooks([]);
    renderHeader();

    const checkbox = screen.getByRole("checkbox", { name: "Layer A" });
    expect(checkbox).not.toBeChecked();
  });

  it("renders a checked checkbox when the layer is selected", () => {
    setupHooks(["10"]);
    renderHeader();

    const checkbox = screen.getByRole("checkbox", { name: "Layer A" });
    expect(checkbox).toBeChecked();
  });

  it("adds the layer id when toggled on", async () => {
    const user = userEvent.setup();
    setupHooks([]);
    renderHeader();

    const checkbox = screen.getByRole("checkbox", { name: "Layer A" });
    await user.click(checkbox);

    expect(setLayerIdsMock).toHaveBeenCalledWith(["10"]);
  });

  it("removes the layer id when toggled off", async () => {
    const user = userEvent.setup();
    setupHooks(["10"]);
    renderHeader();

    const checkbox = screen.getByRole("checkbox", { name: "Layer A" });
    await user.click(checkbox);

    expect(setLayerIdsMock).toHaveBeenCalledWith([]);
  });
});
