import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CloseDialog from "@/containers/analysis/close-dialog";
import messages from "@/i18n/messages/en.json";

const mockPush = vi.fn();
const mockParams = vi.fn<() => Record<string, string>>(() => ({}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
  useParams: () => mockParams(),
}));

const renderDialog = ({
  open = true,
  onOpenChange = vi.fn(),
  searchParams = "",
  onUrlUpdate,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <CloseDialog open={open} onOpenChange={onOpenChange} />
      </NextIntlClientProvider>
    </NuqsTestingAdapter>,
  );

const confirm = async () => {
  const user = userEvent.setup();
  const dialog = screen.getByRole("dialog");
  await user.click(
    within(dialog).getByRole("button", { name: /clear & go back/i }),
  );
};

describe("@containers/analysis/close-dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.mockReturnValue({});
  });

  it("renders dialog content when open", () => {
    renderDialog();

    expect(
      screen.getByRole("dialog", { name: /leave current analysis/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/going back will clear your current analysis/i),
    ).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears only the analysis from the URL and keeps the visitor's layers", async () => {
    const onOpenChange = vi.fn();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderDialog({
      onOpenChange,
      onUrlUpdate,
      searchParams:
        "?mapStatus=analysis&view=results&datasets=true&layers=carbon_cog,water&basemap=satellite",
    });

    await confirm();

    await waitFor(() => {
      const params = onUrlUpdate.mock.lastCall?.[0].searchParams;
      expect(params?.toString()).toBe(
        new URLSearchParams(
          "layers=carbon_cog,water&basemap=satellite",
        ).toString(),
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("navigates home when leaving a shared analysis", async () => {
    mockParams.mockReturnValue({ locale: "en", id: "abc" });
    renderDialog();

    await confirm();

    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
