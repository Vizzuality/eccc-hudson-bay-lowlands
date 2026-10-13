import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import MobileResultsView from "@/containers/mobile-results-view";

vi.mock("@/containers/analysis/panel-content", () => ({
  default: () => <div data-testid="panel" />,
}));

vi.mock("@/hooks/use-analysis-settings", () => ({
  useAnalysisResult: () => ({}),
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => true,
}));

const renderAt = (searchParams: string) =>
  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <MobileResultsView />
    </NuqsTestingAdapter>,
  );

describe("@containers/mobile-results-view", () => {
  it("renders the analysis panel when view=results in analysis mode", () => {
    renderAt("?view=results&mapStatus=analysis");

    expect(screen.getByTestId("panel")).toBeInTheDocument();
  });

  it("renders nothing when view=results is left over outside analysis mode", () => {
    renderAt("?view=results");

    expect(screen.queryByTestId("panel")).not.toBeInTheDocument();
  });
});
