import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useLayers } from "@/app/[locale]/url-store";
import Main from "@/containers/map-sidebar/main";
import messages from "@/i18n/messages/en.json";

const mockSetLayers = vi.fn();

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useLayers: vi.fn(),
  };
});

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

function setupHooks(layers: string[] = []) {
  (useLayers as Mock).mockReturnValue({
    layers,
    setLayers: mockSetLayers,
  });
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const renderMain = () => {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <Main />
      </NextIntlClientProvider>
    </QueryClientProvider>,
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

  it("passes layers and items to DataLayersList", () => {
    setupHooks(["1", "5"]);
    renderMain();

    expect(capturedListProps.layers).toEqual(["1", "5"]);
    expect(capturedListProps.items).toHaveLength(20);
  });

  it("adds a layer when handleItemChange is called with isSelected=true", () => {
    setupHooks(["1", "2"]);
    renderMain();

    const onItemChange = capturedListProps.onItemChange as (
      id: string,
      isSelected: boolean,
    ) => void;
    onItemChange("3", true);

    expect(mockSetLayers).toHaveBeenCalledWith(["1", "2", "3"]);
  });

  it("removes a layer when handleItemChange is called with isSelected=false", () => {
    setupHooks(["1", "2", "3"]);
    renderMain();

    const onItemChange = capturedListProps.onItemChange as (
      id: string,
      isSelected: boolean,
    ) => void;
    onItemChange("2", false);

    expect(mockSetLayers).toHaveBeenCalledWith(["1", "3"]);
  });

  it("passes active layer count to DataLayersBottomBar", () => {
    setupHooks(["1", "2", "3"]);
    renderMain();

    expect(capturedBottomBarProps.activeDataCount).toBe(3);
  });

  it("clears all layers when onRemoveAll is called", () => {
    setupHooks(["1", "2"]);
    renderMain();

    const onRemoveAll = capturedBottomBarProps.onRemoveAll as () => void;
    onRemoveAll();

    expect(mockSetLayers).toHaveBeenCalledWith([]);
  });
});
