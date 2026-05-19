import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import { useShareAnalysis } from "@/hooks/use-share-analysis";
import messages from "@/i18n/messages/en.json";

const mockAnalysisResult = { peat_carbon: {} };
const mockGeometry = { type: "Feature", geometry: { type: "Point" } };

vi.mock("@/hooks/use-analysis-settings", () => ({
  default: () => [{ geometry: mockGeometry }, vi.fn()],
  useAnalysisResult: () => mockAnalysisResult,
  useSetAnalysisResult: () => vi.fn(),
  useIsAnalyzing: () => [false, vi.fn()],
}));

const { mockAPI } = vi.hoisted(() => ({
  mockAPI: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, API: mockAPI };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <AnalysisProvider>{children}</AnalysisProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("useShareAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the dialog with a new URL after a successful share", async () => {
    mockAPI.mockResolvedValueOnce({ id: "share-123" });

    const { result } = renderHook(() => useShareAnalysis(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.triggerShare());

    await waitFor(() => expect(result.current.shareUrl).not.toBeNull());

    expect(result.current.shareUrl).toContain("/en/analysis/share-123");
    expect(result.current.shareDialogOpen).toBe(true);
    expect(result.current.createdAt).not.toBeNull();
  });

  it("reopens the dialog without a new API call when a share URL already exists", async () => {
    mockAPI.mockResolvedValueOnce({ id: "share-456" });

    const { result } = renderHook(() => useShareAnalysis(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.triggerShare());
    await waitFor(() => expect(result.current.shareUrl).not.toBeNull());

    act(() => result.current.setShareDialogOpen(false));

    act(() => result.current.triggerShare());
    expect(result.current.shareDialogOpen).toBe(true);
    expect(mockAPI).toHaveBeenCalledTimes(1);
  });
});
