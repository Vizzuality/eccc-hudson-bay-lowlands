import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import DataLayersListItem, {
  type DataLayersListItemProps,
} from "@/containers/data-layers/list/item";
import messages from "@/i18n/messages/en.json";
import { DATA_LAYERS } from "@/tests/helpers/mocks";

const mockItem = DATA_LAYERS[0];
const defaultProps: DataLayersListItemProps = {
  id: mockItem.id,
  title: mockItem.title,
  description: mockItem.description,
  isSelected: false,
  onChange: vi.fn(),
  onLearnMore: vi.fn(),
};

describe("@containers/data-layers/list/item", () => {
  const renderDataLayersListItem = (
    props: Partial<DataLayersListItemProps> = {},
  ) =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DataLayersListItem {...defaultProps} {...props} />
      </NextIntlClientProvider>,
    );

  it("renders the title and description", () => {
    renderDataLayersListItem();
    expect(
      screen.getByRole("heading", { name: mockItem.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(mockItem.description)).toBeInTheDocument();
  });

  it("renders an unchecked checkbox when not selected", () => {
    renderDataLayersListItem();
    const checkbox = screen.getByRole("checkbox", { name: mockItem.title });
    expect(checkbox).not.toBeChecked();
  });

  it("renders a checked checkbox when selected", () => {
    renderDataLayersListItem({ isSelected: true });
    const checkbox = screen.getByRole("checkbox", { name: mockItem.title });
    expect(checkbox).toBeChecked();
  });

  it("calls onChange with (id, true) when clicking an unselected item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderDataLayersListItem({ onChange });

    await user.click(screen.getByRole("checkbox", { name: mockItem.title }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(mockItem.id, true);
  });

  it("calls onChange with (id, false) when clicking a selected item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderDataLayersListItem({ onChange, isSelected: true });

    await user.click(screen.getByRole("checkbox", { name: mockItem.title }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(mockItem.id, false);
  });

  it("calls onLearnMore when the 'Learn more' button is clicked", async () => {
    const user = userEvent.setup();
    const onLearnMore = vi.fn();
    renderDataLayersListItem({ onLearnMore });

    await user.click(screen.getByRole("button", { name: /learn more/i }));

    expect(onLearnMore).toHaveBeenCalledOnce();
  });

  it("associates the label with the checkbox via htmlFor/id", () => {
    renderDataLayersListItem();
    const checkbox = screen.getByRole("checkbox", { name: mockItem.title });
    expect(checkbox).toHaveAttribute("id", mockItem.id);
  });
});
