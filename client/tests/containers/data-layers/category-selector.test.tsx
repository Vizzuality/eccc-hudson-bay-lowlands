import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import CategorySelector from "@/containers/data-layers/category-selector";
import messages from "@/i18n/messages/en.json";
import { CATEGORIES, TOTAL_LAYER_COUNT } from "@/tests/helpers/mocks";

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
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );
    for (const category of CATEGORIES) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it("renders a fieldset with an accessible label", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole("group", { name: "Category filter" }),
    ).toBeInTheDocument();
  });

  it("renders radio inputs for each category", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(CATEGORIES.length + 1);
  });

  it("checks the radio that matches the current category", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );
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
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );

    const envRadio = screen.getByRole("radio", { name: /Category 1/ });
    await user.click(envRadio);

    expect(mockSetCategory).toHaveBeenCalledOnce();
    expect(mockSetCategory).toHaveBeenCalledWith(1);
  });

  it("displays the data layers count for each category", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={false}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("5 data layers")).toBeInTheDocument(); // All
    expect(screen.getByText("2 data layers")).toBeInTheDocument();
    expect(screen.getByText("3 data layers")).toBeInTheDocument();
    expect(screen.getByText("0 data layers")).toBeInTheDocument();
  });

  it("renders skeleton placeholders when loading", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CategorySelector
          items={CATEGORIES}
          isLoading={true}
          totalLayerCount={TOTAL_LAYER_COUNT}
        />
      </NextIntlClientProvider>,
    );

    for (const category of CATEGORIES) {
      expect(screen.queryByText(category.name)).not.toBeInTheDocument();
    }

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(4 * 3);
  });
});
