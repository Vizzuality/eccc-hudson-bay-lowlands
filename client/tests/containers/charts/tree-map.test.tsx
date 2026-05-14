import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreeMapCell } from "@/containers/charts/tree-map";

describe("TreeMapCell", () => {
  it("renders a rect with gap and rounded corners", () => {
    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TreeMapCell
          x={0}
          y={0}
          width={100}
          height={50}
          fill="red"
          label="Test"
          value={42}
        />
      </svg>,
    );
    const rect = container.querySelector("rect");
    expect(rect).toBeTruthy();
    expect(rect?.getAttribute("x")).toBe("1");
    expect(rect?.getAttribute("y")).toBe("1");
    expect(rect?.getAttribute("width")).toBe("98");
    expect(rect?.getAttribute("height")).toBe("48");
    expect(rect?.getAttribute("rx")).toBe("4");
  });

  it("shows label and value when cell is large enough", () => {
    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TreeMapCell
          x={0}
          y={0}
          width={100}
          height={50}
          fill="red"
          label="Forest"
          value={25}
        />
      </svg>,
    );
    expect(container.textContent).toContain("Forest");
    expect(container.textContent).toContain("25%");
  });

  it("hides label when cell is too small", () => {
    const { container } = render(
      <svg role="img" aria-label="test chart">
        <TreeMapCell
          x={0}
          y={0}
          width={30}
          height={20}
          fill="red"
          label="Tiny"
          value={1}
        />
      </svg>,
    );
    expect(container.querySelector("foreignObject")).toBeNull();
  });
});
