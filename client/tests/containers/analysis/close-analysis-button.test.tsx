import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CloseAnalysisButton from "@/containers/analysis/close-analysis-button";
import messages from "@/i18n/messages/en.json";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useParams: vi.fn(() => ({})),
}));

const renderButton = () =>
  render(
    <NuqsTestingAdapter>
      <NextIntlClientProvider locale="en" messages={messages}>
        <CloseAnalysisButton />
      </NextIntlClientProvider>
    </NuqsTestingAdapter>,
  );

describe("@containers/analysis/close-analysis-button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the close button without opening the dialog", () => {
    renderButton();

    expect(
      screen.getByRole("button", { name: /leave analysis/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the confirmation dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(screen.getByRole("button", { name: /leave analysis/i }));

    expect(
      screen.getByRole("dialog", { name: /leave current analysis/i }),
    ).toBeInTheDocument();
  });
});
