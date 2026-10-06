import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MapLayout from "@/containers/map-layout";

vi.mock("@/containers/map", () => ({
  default: () => <div data-testid="map" />,
}));

vi.mock("@/containers/mobile-data-view", () => ({
  default: () => null,
}));

vi.mock("@/containers/mobile-nav/map-mobile-nav", () => ({
  MapMobileNav: () => null,
}));

vi.mock("@/containers/top-bar", () => ({
  default: () => <div data-testid="top-bar" />,
}));

describe("@containers/map-layout", () => {
  it("renders the sidebar next to the map", () => {
    render(<MapLayout sidebar={<div data-testid="sidebar" />} />);

    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  it("renders children without the map when no sidebar is given", () => {
    render(
      <MapLayout>
        <p>Expired</p>
      </MapLayout>,
    );

    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });
});
