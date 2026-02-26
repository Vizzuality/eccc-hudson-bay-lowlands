import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CategorySelector from "@/containers/data-layers/category-selector";

const MOCK_CATEGORIES = [
  { id: 1, name: "Category 1" },
  { id: 2, name: "Category 2" },
  { id: 3, name: "Category 3" },
];

const { mockSetCategory } = vi.hoisted(() => ({
  mockSetCategory: vi.fn(),
}));

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useCategory: () => ({
      category: 0,
      setCategory: mockSetCategory,
    }),
  };
});

describe("@containers/data-layers/category-selector", () => {
  afterEach(() => {
    cleanup();
    mockSetCategory.mockClear();
  });

  it("renders all category options", () => {
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);
    for (const category of MOCK_CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it("renders a fieldset with an accessible label", () => {
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);
    expect(
      screen.getByRole("group", { name: "Category filter" }),
    ).toBeInTheDocument();
  });

  it("renders radio inputs for each category", () => {
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(MOCK_CATEGORIES.length + 1);
  });

  it("checks the radio that matches the current category", () => {
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);
    const allRadio = screen.getByRole("radio", { name: /All/ });
    expect(allRadio).toBeChecked();

    const otherRadios = screen
      .getAllByRole("radio")
      .filter((r) => r !== allRadio);
    for (const radio of otherRadios) {
      expect(radio).not.toBeChecked();
    }
  });

  it("calls setCategory when a different category is selected", async () => {
    const user = userEvent.setup();
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);

    const envRadio = screen.getByRole("radio", { name: /Category 1/ });
    await user.click(envRadio);

    expect(mockSetCategory).toHaveBeenCalledOnce();
    expect(mockSetCategory).toHaveBeenCalledWith(1);
  });

  it("displays the data layers count for each category", () => {
    render(<CategorySelector items={MOCK_CATEGORIES} isLoading={false} />);
    const counts = screen.getAllByText("5 data layers");
    expect(counts).toHaveLength(MOCK_CATEGORIES.length + 1);
  });

  it("renders skeleton placeholders when loading", () => {
    const { container } = render(
      <CategorySelector items={MOCK_CATEGORIES} isLoading={true} />,
    );

    for (const category of MOCK_CATEGORIES) {
      expect(screen.queryByText(category.name)).not.toBeInTheDocument();
    }

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(4 * 3);
  });
});
