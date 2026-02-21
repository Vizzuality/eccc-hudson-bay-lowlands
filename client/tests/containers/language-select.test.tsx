import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useSearchParams } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LanguageSelect from "@/containers/language-select";
import messages from "@/i18n/messages/en.json";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ locale: "en" })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  usePathname: vi.fn(() => "/"),
}));

beforeEach(() => {
  mockReplace.mockClear();
});

const renderLanguageSelect = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LanguageSelect />
    </NextIntlClientProvider>,
  );

describe("@containers/language-select", () => {
  it("renders a combobox trigger with the current locale abbreviation", () => {
    renderLanguageSelect();
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("en");
  });

  it("lists every locale defined in the routing config", async () => {
    const user = userEvent.setup();
    renderLanguageSelect();

    await user.click(screen.getByRole("combobox"));

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(routing.locales.length);
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "French" })).toBeInTheDocument();
  });

  it("navigates to the selected locale with the current pathname and params", async () => {
    const user = userEvent.setup();
    renderLanguageSelect();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "French" }));

    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: "/", params: { locale: "en" }, query: {} },
      { locale: "fr" },
    );
  });

  it("forwards a non-root pathname and params to router.replace", async () => {
    vi.mocked(usePathname).mockReturnValueOnce("/resources");
    vi.mocked(useParams).mockReturnValueOnce({
      locale: "en",
      slug: "overview",
    });

    const user = userEvent.setup();
    renderLanguageSelect();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "French" }));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/resources",
        params: { locale: "en", slug: "overview" },
      }),
      { locale: "fr" },
    );
  });

  it("preserves search params when changing locale", async () => {
    vi.mocked(useSearchParams).mockReturnValueOnce(
      new URLSearchParams("tab=map&zoom=5") as ReturnType<
        typeof useSearchParams
      >,
    );

    const user = userEvent.setup();
    renderLanguageSelect();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "French" }));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: { tab: "map", zoom: "5" } }),
      { locale: "fr" },
    );
  });

  it("does not navigate when selecting the already-active locale", async () => {
    const user = userEvent.setup();
    renderLanguageSelect();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "English" }));

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
