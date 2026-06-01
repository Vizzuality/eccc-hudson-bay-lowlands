import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopBar from "@/containers/top-bar";
import messages from "@/i18n/messages/en.json";

const { LinkStub } = vi.hoisted(() => ({
  LinkStub: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  Link: LinkStub,
}));

vi.mock("next/link", () => ({
  default: LinkStub,
}));

vi.mock("@/containers/language-select", () => ({
  default: () => <div data-testid="language-select" />,
}));

const renderTopBar = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TopBar />
    </NextIntlClientProvider>,
  );

describe("@containers/top-bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the site title", () => {
    renderTopBar();

    expect(
      screen.getByRole("img", { name: "lowlands spatial data" }),
    ).toBeInTheDocument();
  });

  it("links the logo to the home page", () => {
    renderTopBar();

    const logoLink = screen.getByRole("link", {
      name: "lowlands spatial data",
    });
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders navigation links for all items", () => {
    renderTopBar();

    expect(screen.getByRole("link", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resources" })).toBeInTheDocument();
  });

  it("sets aria-current='page' on the active navigation link", () => {
    renderTopBar();

    const mapLink = screen.getByRole("link", { name: "Map" });
    expect(mapLink).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current on inactive navigation links", () => {
    renderTopBar();

    const resourcesLink = screen.getByRole("link", { name: "Resources" });
    expect(resourcesLink).not.toHaveAttribute("aria-current");
  });

  it("renders the language select", () => {
    renderTopBar();

    expect(screen.getByTestId("language-select")).toBeInTheDocument();
  });
});
