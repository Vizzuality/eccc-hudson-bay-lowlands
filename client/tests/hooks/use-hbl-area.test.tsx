import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { Feature, Polygon } from "geojson";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHblArea, useHblAreaRaw } from "@/hooks/use-hbl-area";

const mockAPI = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, API: mockAPI };
});

const fakeFeature: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  },
};

describe("useHblArea", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockAPI.mockReset();
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("returns an inverted polygon with a world-extent outer ring", async () => {
    mockAPI.mockResolvedValue(fakeFeature);

    const { result } = renderHook(() => useHblArea(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect(data?.geometry.type).toBe("Polygon");
    expect(data?.geometry.coordinates).toHaveLength(2);
    expect(data?.geometry.coordinates[0]).toEqual([
      [-180, -85],
      [180, -85],
      [180, 85],
      [-180, 85],
      [-180, -85],
    ]);
  });
});

describe("useHblAreaRaw", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockAPI.mockReset();
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("returns the original feature without inversion", async () => {
    mockAPI.mockResolvedValue(fakeFeature);

    const { result } = renderHook(() => useHblAreaRaw(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect(data?.geometry.type).toBe("Polygon");
    expect(data?.geometry.coordinates).toHaveLength(1);
    expect(data?.geometry.coordinates[0]).toEqual(
      fakeFeature.geometry.coordinates[0],
    );
  });
});
