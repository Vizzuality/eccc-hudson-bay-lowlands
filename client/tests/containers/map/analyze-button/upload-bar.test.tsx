import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import UploadBar from "@/containers/map/analyze-button/upload-bar";
import messages from "@/i18n/messages/en.json";

const { mockUseMapDraw, mockSetAnalysisSettings, mockAnalysisState } =
  vi.hoisted(() => ({
    mockUseMapDraw: vi.fn(),
    mockSetAnalysisSettings: vi.fn(),
    mockAnalysisState: {
      locationType: "draw" as const,
      geometry: null as GeoJSON.Feature | null,
      fileName: null as string | null,
    },
  }));

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
}));

vi.mock("@/hooks/use-map-draw", () => ({
  default: (props: { onDrawingStart?: () => void }) => mockUseMapDraw(props),
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  default: () => [mockAnalysisState, mockSetAnalysisSettings],
  useSetAnalysisResult: () => vi.fn(),
  useIsAnalyzing: () => [false, vi.fn()],
}));

const mockRedraw = vi.fn();

vi.mock("@/components/ui/popover", () => ({
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let capturedOnDrawingStart: (() => void) | undefined;

const renderUploadBar = (mapStatus = MapStatus.upload) => {
  setupHooks(mapStatus);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <UploadBar />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
};

function setupHooks(mapStatus = MapStatus.upload) {
  (useMapStatus as Mock).mockReturnValue({
    mapStatus,
    setMapStatus: vi.fn(),
  });
  mockUseMapDraw.mockImplementation((props) => {
    capturedOnDrawingStart = props?.onDrawingStart;
    return { redraw: mockRedraw };
  });
}

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

function startDrawing() {
  // The component requires both isDrawing=true AND geometry to show confirmation UI.
  // Set geometry on the mock so hasGeometry is true when the component re-renders.
  mockAnalysisState.geometry = FAKE_GEOMETRY;
  act(() => {
    capturedOnDrawingStart?.();
  });
}

describe("@containers/map/analyze-button/upload-bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDrawingStart = undefined;
    mockAnalysisState.locationType = "draw";
    mockAnalysisState.geometry = null;
    mockAnalysisState.fileName = null;
  });

  it("renders instructions when not drawing", () => {
    renderUploadBar();

    expect(screen.getByText(/click on the map/i)).toBeInTheDocument();
  });

  it("renders drawing instructions and clear/confirm after drawing starts", () => {
    renderUploadBar();
    startDrawing();

    expect(screen.getByText(/to complete your shape/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
  });

  it("hides the initial instructions while drawing", () => {
    renderUploadBar();
    startDrawing();

    expect(screen.queryByText(/click on the map/i)).not.toBeInTheDocument();
  });

  it("calls redraw and clears analysis geometry when Clear is clicked", async () => {
    const user = userEvent.setup();
    renderUploadBar();
    startDrawing();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(mockRedraw).toHaveBeenCalled();
    expect(mockSetAnalysisSettings).toHaveBeenCalled();
    const updater = mockSetAnalysisSettings.mock.calls[0][0];
    expect(
      updater({
        locationType: "draw",
        geometry: { type: "Feature" },
        fileName: null,
      }),
    ).toEqual(
      expect.objectContaining({
        locationType: "draw",
        geometry: null,
        fileName: null,
      }),
    );
  });

  it("returns to instructions after Clear is clicked", async () => {
    const user = userEvent.setup();
    renderUploadBar();
    startDrawing();

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByText(/click on the map/i)).toBeInTheDocument();
  });

  it("runs redraw when map status becomes default", () => {
    renderUploadBar(MapStatus.default);

    expect(mockRedraw).toHaveBeenCalled();
  });
});
