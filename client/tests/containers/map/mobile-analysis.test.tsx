import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import MobileAnalysis from "@/containers/map/mobile-analysis";
import messages from "@/i18n/messages/en.json";

const { mockUseMapDraw, mockAnalysisState, mockApi } = vi.hoisted(() => ({
  mockUseMapDraw: vi.fn(),
  mockAnalysisState: {
    locationType: "draw" as const,
    geometry: null as GeoJSON.Feature | null,
    fileName: null as string | null,
  },
  mockApi: vi.fn(),
}));

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
}));

vi.mock("@/hooks/use-map-draw", () => ({
  default: (props: { onDrawingStart?: () => void }) => mockUseMapDraw(props),
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  default: () => [mockAnalysisState, vi.fn()],
  useSetAnalysisResult: () => vi.fn(),
  useIsAnalyzing: () => [false, vi.fn()],
}));

vi.mock("@/lib/api", () => ({ API: mockApi }));

const FAKE_GEOMETRY: GeoJSON.Feature = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
  properties: {},
};

let capturedOnDrawingStart: (() => void) | undefined;
const mockSetMapStatus = vi.fn();

function renderMobileAnalysis() {
  (useMapStatus as Mock).mockReturnValue({
    mapStatus: MapStatus.upload,
    setMapStatus: mockSetMapStatus,
  });
  mockUseMapDraw.mockImplementation((props) => {
    capturedOnDrawingStart = props?.onDrawingStart;
    return { redraw: vi.fn() };
  });
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <MobileAnalysis />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

function startDrawing() {
  act(() => {
    capturedOnDrawingStart?.();
  });
}

describe("@containers/map/mobile-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDrawingStart = undefined;
    mockAnalysisState.geometry = null;
  });

  it("shows the instructions and leaves upload mode on Cancel analysis", async () => {
    renderMobileAnalysis();

    expect(screen.getByText(/tap on the map/i)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Cancel analysis" }),
    );

    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.default);
  });

  it("swaps to Clear and a disabled Confirm once drawing starts without a closed shape", () => {
    renderMobileAnalysis();
    startDrawing();

    expect(screen.getByText(/tap the first point again/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Cancel analysis" }),
    ).not.toBeInTheDocument();
  });

  it("re-opens a collapsed card when the analysis request fails", async () => {
    mockAnalysisState.geometry = FAKE_GEOMETRY;
    mockApi.mockRejectedValue(new Error("network"));
    renderMobileAnalysis();
    startDrawing();

    await userEvent.click(
      screen.getByRole("button", { name: "Hide instructions" }),
    );
    expect(screen.getByText("Show instructions")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Show instructions")).not.toBeInTheDocument();
  });
});
