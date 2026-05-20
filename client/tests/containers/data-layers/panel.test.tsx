import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/en.json";
import { DATA_LAYERS } from "@/tests/helpers/mocks";

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useMapAnalysis: vi.fn(() => ({
      datasets: true,
      setDatasets: vi.fn(),
    })),
  };
});

vi.mock("@/hooks/use-datasets", () => ({
  useTranslatedDatasets: vi.fn(() => ({
    data: DATA_LAYERS,
    isFetching: false,
  })),
}));

let capturedListProps: Record<string, unknown> = {};

vi.mock("@/containers/data-layers/list", () => ({
  default: (props: Record<string, unknown>) => {
    capturedListProps = props;
    return <div data-testid="data-layers-list" />;
  },
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

const renderPanel = async () => {
  const { default: DataLayersPanel } = await import(
    "@/containers/data-layers/panel"
  );
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DataLayersPanel />
    </NextIntlClientProvider>,
  );
};

describe("@containers/data-layers/panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedListProps = {};
  });

  it("renders DataLayersList with fetched datasets", async () => {
    await renderPanel();

    expect(screen.getByTestId("data-layers-list")).toBeInTheDocument();
    expect(capturedListProps.datasets).toEqual(DATA_LAYERS);
    expect(capturedListProps.isLoading).toBe(false);
  });

  it("passes empty array when data is undefined", async () => {
    const { useTranslatedDatasets } = await import("@/hooks/use-datasets");
    vi.mocked(useTranslatedDatasets).mockReturnValue({
      data: undefined,
      isFetching: true,
    } as ReturnType<typeof useTranslatedDatasets>);

    await renderPanel();

    expect(capturedListProps.datasets).toEqual([]);
    expect(capturedListProps.isLoading).toBe(true);
  });
});
