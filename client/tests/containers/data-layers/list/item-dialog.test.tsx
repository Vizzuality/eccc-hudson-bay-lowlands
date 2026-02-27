import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import DataLayersListItemDialog from "@/containers/data-layers/list/item-dialog";
import messages from "@/i18n/messages/en.json";
import { DATA_LAYERS } from "@/tests/helpers/mocks";
import type { NormalizedDataset } from "@/types";

describe("@containers/data-layers/list/item-dialog", () => {
  const DATASET = DATA_LAYERS[0];

  const renderDialog = (
    props: Partial<{
      open: boolean;
      onOpenChange: (open: boolean) => void;
      dataset: NormalizedDataset | null;
    }> = {},
  ) => {
    const merged = {
      open: true,
      onOpenChange: vi.fn(),
      dataset: DATASET,
      ...props,
    };

    return {
      ...render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <DataLayersListItemDialog {...merged} />
        </NextIntlClientProvider>,
      ),
      ...merged,
    };
  };

  it("renders the dialog with dataset metadata when open", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: DATASET.metadata.title }),
    ).toBeInTheDocument();

    expect(screen.getByText(DATASET.metadata.description)).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText(DATASET.metadata.source)).toBeInTheDocument();
    expect(screen.getByText("Citation")).toBeInTheDocument();
    expect(screen.getByText(DATASET.metadata.citation)).toBeInTheDocument();
  });

  it("does not render the dialog when closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange with false when OK is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderDialog({ onOpenChange });

    await user.click(screen.getByRole("button", { name: /ok/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("handles a null dataset without throwing", () => {
    renderDialog({ dataset: null });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
