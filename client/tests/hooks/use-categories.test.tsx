import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCategoryItems, useCategories } from "@/hooks/use-categories";
import messages from "@/i18n/messages/en.json";
import type {
  CategoryResponse,
  Dataset,
  DatasetResponse,
  NormalizedCategory,
} from "@/types";

const { mockAPI, mockUseCategory } = vi.hoisted(() => ({
  mockAPI: vi.fn(),
  mockUseCategory: vi.fn(() => ({ category: null as number | null })),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, API: mockAPI };
});

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return { ...actual, useCategory: mockUseCategory };
});

const makeDataset = (
  id: number,
  categoryId: number,
  layerCount: number,
): Dataset => ({
  id,
  category_id: categoryId,
  metadata: {
    title: { en: "" },
    description: { en: "" },
    source: { en: "" },
    citation: { en: "" },
  },
  layers: Array.from({ length: layerCount }, (_, i) => ({
    id: id * 100 + i,
    format: "geojson",
    type: "vector",
    path: "/p",
    unit: "km",
    categories: null,
    metadata: { title: { en: "" }, description: { en: "" } },
    dataset_id: id,
  })),
});

const categories: NormalizedCategory[] = [
  { id: 1, name: "Environment" },
  { id: 2, name: "Wildlife" },
  { id: 3, name: "Climate" },
];

const categoriesResponse: CategoryResponse = {
  data: [
    { id: 1, metadata: { title: { en: "Environment", fr: "Environnement" } } },
    { id: 2, metadata: { title: { en: "Wildlife", fr: "Faune" } } },
  ],
  total: 2,
};

const datasetsResponse: DatasetResponse = {
  data: [makeDataset(10, 1, 2), makeDataset(20, 2, 1)],
  total: 2,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

describe("buildCategoryItems", () => {
  it("computes layer counts per category", () => {
    const datasets = [
      makeDataset(10, 1, 2),
      makeDataset(20, 2, 1),
      makeDataset(30, 1, 3),
    ];

    const { categoryItems, totalLayerCount } = buildCategoryItems(
      categories,
      datasets,
    );

    expect(categoryItems).toEqual([
      { id: 1, name: "Environment", layerCount: 5 },
      { id: 2, name: "Wildlife", layerCount: 1 },
      { id: 3, name: "Climate", layerCount: 0 },
    ]);
    expect(totalLayerCount).toBe(6);
  });

  it("returns empty items when categories is undefined", () => {
    const { categoryItems, totalLayerCount } = buildCategoryItems(undefined, [
      makeDataset(10, 1, 2),
    ]);

    expect(categoryItems).toEqual([]);
    expect(totalLayerCount).toBe(0);
  });

  it("returns zero counts when datasets is undefined", () => {
    const { categoryItems, totalLayerCount } = buildCategoryItems(
      categories,
      undefined,
    );

    expect(categoryItems).toEqual([
      { id: 1, name: "Environment", layerCount: 0 },
      { id: 2, name: "Wildlife", layerCount: 0 },
      { id: 3, name: "Climate", layerCount: 0 },
    ]);
    expect(totalLayerCount).toBe(0);
  });

  it("skips datasets with no layers", () => {
    const datasets = [makeDataset(10, 1, 0), makeDataset(20, 1, 2)];

    const { categoryItems, totalLayerCount } = buildCategoryItems(
      categories,
      datasets,
    );

    expect(categoryItems[0].layerCount).toBe(2);
    expect(totalLayerCount).toBe(2);
  });

  it("handles datasets with undefined layers", () => {
    const dataset: Dataset = {
      id: 10,
      category_id: 1,
      metadata: {
        title: { en: "" },
        description: { en: "" },
        source: { en: "" },
        citation: { en: "" },
      },
    };

    const { categoryItems, totalLayerCount } = buildCategoryItems(categories, [
      dataset,
    ]);

    expect(categoryItems[0].layerCount).toBe(0);
    expect(totalLayerCount).toBe(0);
  });
});

describe("useCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategory.mockReturnValue({ category: null });
  });

  it("returns category items with layer counts from API data", async () => {
    mockAPI
      .mockResolvedValueOnce(categoriesResponse)
      .mockResolvedValueOnce(datasetsResponse);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.categoryItems.length).toBeGreaterThan(0),
    );

    expect(result.current.categoryItems).toEqual([
      { id: 1, name: "Environment", layerCount: 2 },
      { id: 2, name: "Wildlife", layerCount: 1 },
    ]);
    expect(result.current.totalLayerCount).toBe(3);
    expect(result.current.isCategoriesLoading).toBe(false);
  });

  it("returns empty items while loading", () => {
    mockAPI.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.categoryItems).toEqual([]);
    expect(result.current.totalLayerCount).toBe(0);
    expect(result.current.isCategoriesLoading).toBe(true);
  });

  it("exposes the selected category from url state", () => {
    mockUseCategory.mockReturnValue({ category: 2 });
    mockAPI.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.category).toBe(2);
  });
});
