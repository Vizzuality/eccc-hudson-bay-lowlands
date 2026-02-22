import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { MapStatus, useMapShape, useMapStatus } from "@/app/[locale]/url-store";
import UploadBar from "@/containers/map/analyze-button/upload-bar";

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
  useMapShape: vi.fn(),
}));

vi.mock("@/components/ui/popover", () => ({
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockSetMapStatus = vi.fn();
const mockSetMapShape = vi.fn();

function setupHooks(mapShape = false) {
  (useMapStatus as Mock).mockReturnValue({
    mapStatus: MapStatus.upload,
    setMapStatus: mockSetMapStatus,
  });
  (useMapShape as Mock).mockReturnValue({
    mapShape,
    setMapShape: mockSetMapShape,
  });
}

describe("@containers/map/analyze-button/upload-bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload prompt when no shape is present", () => {
    setupHooks(false);
    render(<UploadBar />);

    expect(
      screen.getByText(/click on the map to start drawing/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("calls setMapShape(true) when Upload is clicked", async () => {
    setupHooks(false);
    const user = userEvent.setup();
    render(<UploadBar />);

    await user.click(screen.getByRole("button", { name: /upload/i }));

    expect(mockSetMapShape).toHaveBeenCalledWith(true);
  });

  it("renders confirm and clear controls when a shape is present", () => {
    setupHooks(true);
    render(<UploadBar />);

    expect(screen.getByText(/verify your shape/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
  });

  it("hides upload prompt when a shape is present", () => {
    setupHooks(true);
    render(<UploadBar />);

    expect(
      screen.queryByText(/click on the map to start drawing/i),
    ).not.toBeInTheDocument();
  });

  it("calls setMapShape(false) when Clear is clicked", async () => {
    setupHooks(true);
    const user = userEvent.setup();
    render(<UploadBar />);

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(mockSetMapShape).toHaveBeenCalledWith(false);
  });

  it("transitions to analysis when Confirm is clicked", async () => {
    setupHooks(true);
    const user = userEvent.setup();
    render(<UploadBar />);

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.analysis);
  });
});
