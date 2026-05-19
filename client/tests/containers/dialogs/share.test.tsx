import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ShareDialog from "@/containers/dialogs/share";
import messages from "@/i18n/messages/en.json";

const SHARE_URL = "http://localhost:3000/en/analysis/abc-123";
const CREATED_AT = new Date().toISOString();

const renderDialog = (
  props: Partial<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    createdAt: string;
  }> = {},
) => {
  const merged = {
    open: true,
    onOpenChange: vi.fn(),
    url: SHARE_URL,
    createdAt: CREATED_AT,
    ...props,
  };

  return {
    ...render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ShareDialog {...merged} />
      </NextIntlClientProvider>,
    ),
    ...merged,
  };
};

describe("@containers/dialogs/share", () => {
  it("renders the dialog with share URL when open", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: messages["share-dialog"].title }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(SHARE_URL)).toBeInTheDocument();
  });

  it("does not render the dialog when closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("copies the URL to clipboard when Copy is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("button", { name: messages["share-dialog"].copy }),
    );

    const clipboardText = await navigator.clipboard.readText();
    expect(clipboardText).toBe(SHARE_URL);
    expect(
      screen.getByRole("button", { name: messages["share-dialog"].copy }),
    ).toHaveTextContent(messages["share-dialog"].copied);
  });
});
