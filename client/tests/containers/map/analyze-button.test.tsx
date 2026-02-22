import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";

vi.mock("@/app/[locale]/url-store", () => ({
  MapStatus: { default: "default", upload: "upload", analysis: "analysis" },
  useMapStatus: vi.fn(),
}));

vi.mock("@/containers/map/analyze-button/main-button", () => ({
  default: () => <div data-testid="main-button" />,
}));

vi.mock("@/containers/map/analyze-button/upload-bar", () => ({
  default: () => <div data-testid="upload-bar" />,
}));

let capturedPopoverProps: Record<string, unknown> = {};

vi.mock("@/components/ui/popover", () => ({
  Popover: (props: Record<string, unknown>) => {
    capturedPopoverProps = props;
    return <div data-testid="popover">{props.children as React.ReactNode}</div>;
  },
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

const mockSetMapStatus = vi.fn();

function setupHook(mapStatus: MapStatus) {
  (useMapStatus as Mock).mockReturnValue({
    mapStatus,
    setMapStatus: mockSetMapStatus,
  });
}

async function importAndRender() {
  const { default: AnalyzeButton } = await import(
    "@/containers/map/analyze-button"
  );
  return render(<AnalyzeButton />);
}

describe("@containers/map/analyze-button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPopoverProps = {};
  });

  it("renders MainButton and UploadBar", async () => {
    setupHook(MapStatus.default);
    await importAndRender();

    expect(screen.getByTestId("main-button")).toBeInTheDocument();
    expect(screen.getByTestId("upload-bar")).toBeInTheDocument();
  });

  it("passes open=true to Popover when mapStatus is upload", async () => {
    setupHook(MapStatus.upload);
    await importAndRender();

    expect(capturedPopoverProps.open).toBe(true);
  });

  it("passes open=false to Popover when mapStatus is default", async () => {
    setupHook(MapStatus.default);
    await importAndRender();

    expect(capturedPopoverProps.open).toBe(false);
  });

  it("passes open=false to Popover when mapStatus is analysis", async () => {
    setupHook(MapStatus.analysis);
    await importAndRender();

    expect(capturedPopoverProps.open).toBe(false);
  });

  it("sets mapStatus to upload when onOpenChange is called with true", async () => {
    setupHook(MapStatus.default);
    await importAndRender();

    const onOpenChange = capturedPopoverProps.onOpenChange as (
      open: boolean,
    ) => void;
    onOpenChange(true);

    expect(mockSetMapStatus).toHaveBeenCalledOnce();
    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.upload);
  });

  it("sets mapStatus to default when onOpenChange is called with false", async () => {
    setupHook(MapStatus.upload);
    await importAndRender();

    const onOpenChange = capturedPopoverProps.onOpenChange as (
      open: boolean,
    ) => void;
    onOpenChange(false);

    expect(mockSetMapStatus).toHaveBeenCalledOnce();
    expect(mockSetMapStatus).toHaveBeenCalledWith(MapStatus.default);
  });

  it("does not call setMapStatus when mapStatus is analysis", async () => {
    setupHook(MapStatus.analysis);
    await importAndRender();

    const onOpenChange = capturedPopoverProps.onOpenChange as (
      open: boolean,
    ) => void;
    onOpenChange(true);
    onOpenChange(false);

    expect(mockSetMapStatus).not.toHaveBeenCalled();
  });
});
