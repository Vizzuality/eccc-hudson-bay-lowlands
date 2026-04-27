import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import Analysis from "@/containers/map-sidebar/analysis";
import { mockAnalysisResult } from "@/containers/map-sidebar/analysis/mockData";
import messages from "@/i18n/messages/en.json";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

vi.mock("@/hooks/use-analysis-settings", () => ({
  useAnalysisResult: () => mockAnalysisResult,
}));

const renderAnalysis = () => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TooltipProvider>
        <Analysis />
      </TooltipProvider>
    </NextIntlClientProvider>,
  );
};

describe("@containers/map-sidebar/analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLayerIds as Mock).mockReturnValue({
      layerIds: [],
      setLayerIds: vi.fn(),
    });
  });

  it("renders the heading", () => {
    renderAnalysis();

    expect(
      screen.getByRole("heading", { name: /my area of interest/i }),
    ).toBeInTheDocument();
  });

  it("renders every analysis widget with its translated title", () => {
    renderAnalysis();

    const widgetNamespaces = (
      Object.keys(messages.widgets) as Array<keyof typeof messages.widgets>
    ).filter((key) => key !== "share" && key !== "card");

    expect(widgetNamespaces).toHaveLength(
      Object.keys(mockAnalysisResult).length,
    );

    for (const key of widgetNamespaces) {
      expect(
        screen.getByRole("heading", { name: messages.widgets[key].title }),
      ).toBeInTheDocument();
    }
  });

  it("renders the share widget", () => {
    renderAnalysis();

    expect(
      screen.getByText(messages.widgets.share.description),
    ).toBeInTheDocument();
  });

  it("opens the close dialog when the close button is clicked", async () => {
    const user = userEvent.setup();
    renderAnalysis();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /leave analysis/i }));

    expect(
      screen.getByRole("dialog", { name: /leave current analysis/i }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderAnalysis();

    await user.click(screen.getByRole("button", { name: /leave analysis/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
