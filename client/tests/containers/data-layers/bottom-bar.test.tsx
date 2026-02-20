import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DataLayersBottomBar from "@/containers/data-layers/bottom-bar";

describe("@containers/data-layers/bottom-bar", () => {
  const mockOnRemoveAll = vi.fn();

  it("displays the active data count", () => {
    const { container } = render(
      <DataLayersBottomBar activeDataCount={3} onRemoveAll={mockOnRemoveAll} />,
    );
    const section = container.querySelector("section");
    expect(section).not.toHaveClass("hidden");
    expect(screen.getByText("Active data (3)")).toBeInTheDocument();
  });

  it("is hidden when activeDataCount is 0", () => {
    const { container } = render(
      <DataLayersBottomBar activeDataCount={0} onRemoveAll={mockOnRemoveAll} />,
    );
    const section = container.querySelector("section");
    expect(section).toHaveClass("hidden");
  });

  it("calls onRemoveAll when the remove all button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveAll = vi.fn();
    render(
      <DataLayersBottomBar activeDataCount={2} onRemoveAll={onRemoveAll} />,
    );

    await user.click(screen.getByRole("button", { name: /remove all/i }));

    expect(onRemoveAll).toHaveBeenCalledOnce();
  });
});
