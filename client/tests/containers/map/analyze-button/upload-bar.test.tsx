import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import UploadBar from "@/containers/map/analyze-button/upload-bar";
import messages from "@/i18n/messages/en.json";

const { mockUseMapDraw, mockSetAnalysisSettings } = vi.hoisted(() => ({
  mockUseMapDraw: vi.fn(),
  mockSetAnalysisSettings: vi.fn(),
}));

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
}));

vi.mock("@/hooks/use-map-draw", () => ({
  default: (props: {
    onDrawingStart?: () => void;
  }) => mockUseMapDraw(props),
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  default: () => [
    { locationType: "draw" as const, geometry: null },
    mockSetAnalysisSettings,
  ],
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
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <UploadBar />
    </NextIntlClientProvider>,
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

function startDrawing() {
  act(() => {
    capturedOnDrawingStart?.();
  });
}

describe("@containers/map/analyze-button/upload-bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDrawingStart = undefined;
  });

  it("renders instructions and upload button when not drawing", () => {
    renderUploadBar();

    expect(
      screen.getByText(/click on the map to start drawing/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("renders verify shape and clear/confirm after drawing starts", () => {
    renderUploadBar();
    startDrawing();

    expect(screen.getByText(/verify your shape/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
  });

  it("hides the initial instructions while drawing", () => {
    renderUploadBar();
    startDrawing();

    expect(
      screen.queryByText(/click on the map to start drawing/i),
    ).not.toBeInTheDocument();
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
      updater({ locationType: "draw", geometry: { type: "Feature" } }),
    ).toEqual(expect.objectContaining({ geometry: null }));
  });

  it("returns to instructions after Confirm is clicked", async () => {
    const user = userEvent.setup();
    renderUploadBar();
    startDrawing();

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(
      screen.getByText(/click on the map to start drawing/i),
    ).toBeInTheDocument();
  });

  it("runs redraw when map status becomes default", () => {
    renderUploadBar(MapStatus.default);

    expect(mockRedraw).toHaveBeenCalled();
  });
});
