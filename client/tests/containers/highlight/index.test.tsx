import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Highlight from "@/containers/highlight";

describe("@containers/highlight", () => {
  it("renders the value and label", () => {
    render(<Highlight label="Snow depth" value="1.2 m" />);

    expect(screen.getByText("1.2 m")).toBeInTheDocument();
    expect(screen.getByText("Snow depth")).toBeInTheDocument();
  });

  it("applies the className to the value element", () => {
    render(<Highlight label="Label" value="42" className="bg-red-500" />);

    expect(screen.getByText("42")).toHaveClass("bg-red-500");
  });
});
