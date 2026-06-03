import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartConfig } from "@/components/ui/chart";
import DonutChart from "@/containers/charts/donut-chart";

const chartConfig = {
  forest: { label: "Forest", color: "#10B981" },
} satisfies ChartConfig;

const data = [
  { key: "forest", label: "Forest", value: 60, fill: "#10B981" },
  // key intentionally absent from chartConfig to exercise the `?? ""` fallback
  { key: "wetland", label: "Wetland", value: 40, fill: "#022C22" },
];

describe("DonutChart", () => {
  it("renders a legend item for each data entry", () => {
    const { container } = render(
      <DonutChart data={data} chartConfig={chartConfig} />,
    );
    expect(container.textContent).toContain("Forest");
    expect(container.textContent).toContain("Wetland");
  });

  it("renders a download-only legend with values", () => {
    const { container } = render(
      <DonutChart data={data} chartConfig={chartConfig} />,
    );
    const downloadOnly = container.querySelector("[data-download-only]");
    expect(downloadOnly?.textContent).toContain("Forest (60%)");
    expect(downloadOnly?.textContent).toContain("Wetland (40%)");
  });

  it("falls back to an empty fill when the key is missing from chartConfig", () => {
    const { container } = render(
      <DonutChart data={data} chartConfig={chartConfig} />,
    );
    const swatches = container.querySelectorAll(
      "[data-download-exclude] .rounded-full",
    );
    const fills = Array.from(swatches).map(
      (el) => (el as HTMLElement).style.backgroundColor,
    );
    expect(fills).toContain("rgb(16, 185, 129)");
    expect(fills).toContain("");
  });
});
