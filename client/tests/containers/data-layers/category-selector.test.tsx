import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Category } from "@/app/[locale]/url-store";
import CategorySelector from "@/containers/data-layers/category-selector";
import { CATEGORIES } from "@/containers/data-layers/constants";

const { mockSetCategory } = vi.hoisted(() => ({
  mockSetCategory: vi.fn(),
}));

vi.mock("@/app/[locale]/url-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/[locale]/url-store")>();
  return {
    ...actual,
    useCategory: () => ({
      category: actual.Category.all,
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
    render(<CategorySelector />);
    for (const category of CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it("renders a fieldset with an accessible label", () => {
    render(<CategorySelector />);
    expect(
      screen.getByRole("group", { name: "Category filter" }),
    ).toBeInTheDocument();
  });

  it("renders radio inputs for each category", () => {
    render(<CategorySelector />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(CATEGORIES.length);
  });

  it("checks the radio that matches the current category", () => {
    render(<CategorySelector />);
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
    render(<CategorySelector />);

    const envRadio = screen.getByRole("radio", { name: /Environment/ });
    await user.click(envRadio);

    expect(mockSetCategory).toHaveBeenCalledOnce();
    expect(mockSetCategory).toHaveBeenCalledWith(Category.environment);
  });

  it("displays the data layers count for each category", () => {
    render(<CategorySelector />);
    const counts = screen.getAllByText("5 data layers");
    expect(counts).toHaveLength(CATEGORIES.length);
  });
});
