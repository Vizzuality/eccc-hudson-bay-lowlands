import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayerIds } from "@/app/[locale]/url-store";
import Main from "@/containers/map-sidebar/main";
import messages from "@/i18n/messages/en.json";
import {
  CATEGORIES,
  DATA_LAYERS,
  TOTAL_LAYER_COUNT,
} from "@/tests/helpers/mocks";

const mockSetLayerIds = vi.fn();

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayerIds: vi.fn(),
  };
});

vi.mock("@/hooks/use-categories", () => ({
  useCategories: vi.fn(() => ({
    categoryItems: CATEGORIES,
    totalLayerCount: TOTAL_LAYER_COUNT,
    isCategoriesLoading: false,
    category: null,
  })),
}));

vi.mock("@/hooks/use-datasets", () => ({
  useTranslatedDatasets: vi.fn(() => ({
    data: DATA_LAYERS,
    isFetching: false,
  })),
}));

let capturedListProps: Record<string, unknown> = {};
let capturedBottomBarProps: Record<string, unknown> = {};

vi.mock("@/containers/data-layers/search", () => ({
  default: () => <div data-testid="search" />,
}));

vi.mock("@/containers/data-layers/category-selector", () => ({
  default: () => <div data-testid="category-selector" />,
}));

vi.mock("@/containers/data-layers/list", () => ({
  default: (props: Record<string, unknown>) => {
    capturedListProps = props;
    return <div data-testid="data-layers-list" />;
  },
}));

vi.mock("@/containers/data-layers/bottom-bar", () => ({
  default: (props: Record<string, unknown>) => {
    capturedBottomBarProps = props;
    return <div data-testid="bottom-bar" />;
  },
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function setupHooks(layerIds: number[] = []) {
  (useLayerIds as Mock).mockReturnValue({
    layerIds,
    setLayerIds: mockSetLayerIds,
  });
}

const renderMain = () => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Main />
    </NextIntlClientProvider>,
  );
};

describe("@containers/map-sidebar/main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedListProps = {};
    capturedBottomBarProps = {};
  });

  it("renders the title and description", () => {
    setupHooks();
    renderMain();

    expect(
      screen.getByRole("heading", { name: /discover the hudson/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/explore and combine/i)).toBeInTheDocument();
  });

  it("passes datasets to DataLayersList", () => {
    setupHooks([1, 5]);
    renderMain();

    expect(capturedListProps.datasets).toBeDefined();
    expect(Array.isArray(capturedListProps.datasets)).toBe(true);
  });

  it("passes active layer count to DataLayersBottomBar", () => {
    setupHooks([1, 2, 3]);
    renderMain();

    expect(capturedBottomBarProps.activeDataCount).toBe(3);
  });

  it("clears all layers when onRemoveAll is called", () => {
    setupHooks([1, 2]);
    renderMain();

    const onRemoveAll = capturedBottomBarProps.onRemoveAll as () => void;
    onRemoveAll();

    expect(mockSetLayerIds).toHaveBeenCalledWith([]);
  });
});
