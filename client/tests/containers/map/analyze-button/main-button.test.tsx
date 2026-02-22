import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  MapStatus,
  useMapAnalysis,
  useMapStatus,
} from "@/app/[locale]/url-store";
import MainButton from "@/containers/map/analyze-button/main-button";

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
  useMapAnalysis: vi.fn(),
}));

vi.mock("@/components/ui/popover", () => ({
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@radix-ui/react-tooltip", () => ({
  TooltipPortal: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockSetMapStatus = vi.fn();
const mockSetDatasets = vi.fn();

function setupHooks(mapStatus: MapStatus, datasets = false) {
  (useMapStatus as Mock).mockReturnValue({
    mapStatus,
    setMapStatus: mockSetMapStatus,
  });
  (useMapAnalysis as Mock).mockReturnValue({
    datasets,
    setDatasets: mockSetDatasets,
  });
}

describe("@containers/map/analyze-button/main-button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Analyze area' when mapStatus is default", () => {
    setupHooks(MapStatus.default);
    render(<MainButton />);

    expect(
      screen.getByRole("button", { name: /analyze area/i }),
    ).toBeInTheDocument();
  });

  it("renders 'Cancel' when mapStatus is upload", () => {
    setupHooks(MapStatus.upload);
    render(<MainButton />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("renders 'Datasets' when mapStatus is analysis", () => {
    setupHooks(MapStatus.analysis);
    render(<MainButton />);

    expect(
      screen.getByRole("button", { name: /datasets/i }),
    ).toBeInTheDocument();
  });

  it("transitions from default to upload on click", async () => {
    setupHooks(MapStatus.default);
    const user = userEvent.setup();
    render(<MainButton />);

    await user.click(screen.getByRole("button"));

    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.upload);
  });

  it("transitions from upload to default on click", async () => {
    setupHooks(MapStatus.upload);
    const user = userEvent.setup();
    render(<MainButton />);

    await user.click(screen.getByRole("button"));

    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.default);
  });

  it("toggles datasets on when mapStatus is analysis and datasets is off", async () => {
    setupHooks(MapStatus.analysis, false);
    const user = userEvent.setup();
    render(<MainButton />);

    await user.click(screen.getByRole("button"));

    expect(mockSetDatasets).toHaveBeenCalledWith(true);
    expect(mockSetMapStatus).not.toHaveBeenCalled();
  });

  it("toggles datasets off when mapStatus is analysis and datasets is on", async () => {
    setupHooks(MapStatus.analysis, true);
    const user = userEvent.setup();
    render(<MainButton />);

    await user.click(screen.getByRole("button"));

    expect(mockSetDatasets).toHaveBeenCalledWith(false);
  });

  it("shows tooltip when mapStatus is default", () => {
    setupHooks(MapStatus.default);
    render(<MainButton />);

    expect(
      screen.getByText(/click to select your area of interest/i),
    ).toBeInTheDocument();
  });

  it("hides tooltip when mapStatus is upload", () => {
    setupHooks(MapStatus.upload);
    render(<MainButton />);

    expect(
      screen.queryByText(/click to select your area of interest/i),
    ).not.toBeInTheDocument();
  });

  it("hides tooltip when mapStatus is analysis", () => {
    setupHooks(MapStatus.analysis);
    render(<MainButton />);

    expect(
      screen.queryByText(/click to select your area of interest/i),
    ).not.toBeInTheDocument();
  });
});
