import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUploadAnalysis } from "@/containers/map/analyze-button/upload-bar/use-upload-analysis";

const mockGeometry = {
  type: "Feature",
  geometry: { type: "Polygon", coordinates: [] },
};

const { mockAPI } = vi.hoisted(() => ({ mockAPI: vi.fn() }));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, API: mockAPI };
});

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: () => ({ mapStatus: "upload", setMapStatus: vi.fn() }),
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  default: () => [
    { geometry: mockGeometry, locationType: "draw", fileName: null },
    vi.fn(),
  ],
  useSetAnalysisResult: () => vi.fn(),
  useIsAnalyzing: () => [false, vi.fn()],
}));

function rejectWith(detail: string) {
  mockAPI.mockRejectedValueOnce(
    new AxiosError("Unprocessable Entity", "ERR_BAD_REQUEST", undefined, null, {
      status: 422,
      data: { detail },
    } as AxiosResponse),
  );
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUploadAnalysis error mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports an under-minimum area as area-too-small", async () => {
    rejectWith("Geometry area (0.007000 km²) is below the minimum of 1.0 km²");

    const { result } = renderHook(() => useUploadAnalysis(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.handleConfirm());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("area-too-small");
  });

  it("reports an over-maximum area as area-too-big", async () => {
    rejectWith(
      "Geometry area (16,600,000.00 km²) exceeds the maximum of 50,000 km²",
    );

    const { result } = renderHook(() => useUploadAnalysis(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.handleConfirm());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("area-too-big");
  });
});
