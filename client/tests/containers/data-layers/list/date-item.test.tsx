import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import DateItem from "@/containers/data-layers/list/item/date-item";
import messages from "@/i18n/messages/en.json";
import { LAYERS } from "@/tests/helpers/mocks";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

describe("@containers/data-layers/list/date-item", () => {
  let latestLayerIds: number[];
  let setLayerIdsMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    latestLayerIds = [];
    setLayerIdsMock = vi.fn(
      (updater: number[] | ((ids: number[]) => number[])) => {
        if (typeof updater === "function") {
          latestLayerIds = updater(latestLayerIds);
        } else {
          latestLayerIds = updater;
        }
        return latestLayerIds;
      },
    );
  });

  const setupHooks = (selectedLayerIds: number[] = []) => {
    latestLayerIds = selectedLayerIds.slice();
    (useLayerIds as Mock).mockReturnValue({
      layerIds: latestLayerIds,
      setLayerIds: setLayerIdsMock,
    });
  };

  const renderDateItem = () =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DateItem layers={LAYERS} />
      </NextIntlClientProvider>,
    );

  it("renders radio options for each year range", () => {
    setupHooks([10]);
    renderDateItem();

    expect(screen.getByText("2018 - 2019")).toBeInTheDocument();
    expect(screen.getByText("2019 - 2020")).toBeInTheDocument();
  });

  it("replaces the selected layer id when a different year is chosen and the current layer is visible", async () => {
    const user = userEvent.setup();
    setupHooks([10]);
    renderDateItem();

    await user.click(screen.getByText("2019 - 2020"));

    expect(setLayerIdsMock).toHaveBeenCalledTimes(1);
    expect(latestLayerIds).toEqual([20]);
  });

  it("does not update layer ids when the current layer is not visible", async () => {
    const user = userEvent.setup();
    setupHooks([]);
    renderDateItem();

    await user.click(screen.getByText("2019 - 2020"));

    expect(setLayerIdsMock).not.toHaveBeenCalled();
    expect(latestLayerIds).toEqual([]);
  });
});
