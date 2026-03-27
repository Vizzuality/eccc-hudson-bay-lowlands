import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Highlight from "@/containers/highlight";

describe("@containers/highlight", () => {
  it("renders the value and label", () => {
    render(<Highlight label="Snow depth" value="1.2 m" />);

    expect(screen.getByText("1.2 m")).toBeInTheDocument();
    expect(screen.getByText("Snow depth")).toBeInTheDocument();
  });

  it("applies the className to the component", () => {
    render(<Highlight label="Label" value="42" className="bg-red-500" />);

    const highlightEl = screen.getByRole("region", { name: "Label" });
    expect(highlightEl).toHaveClass("bg-red-500");
  });
});
