import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DataLayersListItem from "@/containers/data-layers/list/item";

const mockId = "layer-1";
const mockName = "First Nation Locations";
const mockDescription = "The location identifies where the First Nations live.";
const defaultProps = {
  id: mockId,
  title: mockName,
  description: mockDescription,
  isSelected: false,
  onChange: vi.fn(),
  onLearnMore: vi.fn(),
};

describe("@containers/data-layers/list/item", () => {
  it("renders the title and description", () => {
    render(<DataLayersListItem {...defaultProps} />);
    expect(screen.getByRole("heading", { name: mockName })).toBeInTheDocument();
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
  });

  it("renders an unchecked checkbox when not selected", () => {
    render(<DataLayersListItem {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox", { name: mockName });
    expect(checkbox).not.toBeChecked();
  });

  it("renders a checked checkbox when selected", () => {
    render(<DataLayersListItem {...defaultProps} isSelected />);
    const checkbox = screen.getByRole("checkbox", { name: mockName });
    expect(checkbox).toBeChecked();
  });

  it("calls onChange with (id, true) when clicking an unselected item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataLayersListItem {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: mockName }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(mockId, true);
  });

  it("calls onChange with (id, false) when clicking a selected item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DataLayersListItem {...defaultProps} isSelected onChange={onChange} />,
    );

    await user.click(screen.getByRole("checkbox", { name: mockName }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(mockId, false);
  });

  it("calls onLearnMore when the 'Learn more' button is clicked", async () => {
    const user = userEvent.setup();
    const onLearnMore = vi.fn();
    render(<DataLayersListItem {...defaultProps} onLearnMore={onLearnMore} />);

    await user.click(screen.getByRole("button", { name: /learn more/i }));

    expect(onLearnMore).toHaveBeenCalledOnce();
  });

  it("associates the label with the checkbox via htmlFor/id", () => {
    render(<DataLayersListItem {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox", { name: mockName });
    expect(checkbox).toHaveAttribute("id", mockId);
  });
});
