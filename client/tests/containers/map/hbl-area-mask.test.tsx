import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { Feature, Polygon } from "geojson";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HblAreaMask } from "@/containers/map/hbl-area-mask";

const mockUseHblArea = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-hbl-area", () => ({
  useHblArea: mockUseHblArea,
}));

vi.mock("react-map-gl/mapbox", () => ({
  Source: ({ children, id }: PropsWithChildren<{ id: string }>) => (
    <div data-testid={`source-${id}`}>{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

const invertedFeature: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    ],
  },
};

describe("HblAreaMask", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    mockUseHblArea.mockReset();
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders source and layer when data is available", () => {
    mockUseHblArea.mockReturnValue({ data: invertedFeature });

    const { getByTestId } = render(<HblAreaMask />, { wrapper });

    expect(getByTestId("source-hbl-area-mask")).toBeDefined();
    expect(getByTestId("layer-hbl-area-mask-fill")).toBeDefined();
  });

  it("renders a loading spinner while data is loading", () => {
    mockUseHblArea.mockReturnValue({ data: undefined, isLoading: true });

    const { getByLabelText } = render(<HblAreaMask />, { wrapper });

    expect(getByLabelText("Loading study area")).toBeDefined();
  });

  it("renders nothing when data is not available and not loading", () => {
    mockUseHblArea.mockReturnValue({ data: undefined, isLoading: false });

    const { container } = render(<HblAreaMask />, { wrapper });

    expect(container.innerHTML).toBe("");
  });
});
