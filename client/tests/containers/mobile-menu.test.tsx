import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import {
  NuqsTestingAdapter,
  type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MobileMenu,
  MobileMenuArea,
  MobileMenuTrigger,
} from "@/containers/mobile-menu";
import { forgetMenuEntry } from "@/containers/mobile-menu/use-mobile-menu";
import { useIsMobile } from "@/hooks/use-is-mobile";
import messages from "@/i18n/messages/en.json";

const { LinkStub, mockBack, mockReplace } = vi.hoisted(() => ({
  mockBack: vi.fn(),
  mockReplace: vi.fn(),
  LinkStub: ({
    children,
    href,
    replace: _replace,
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

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ back: mockBack })),
  useParams: vi.fn(() => ({ locale: "en" })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  usePathname: vi.fn(() => "/"),
  Link: LinkStub,
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: vi.fn(() => true),
}));

const renderMenu = (searchParams = "") => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  render(
    <NuqsTestingAdapter
      searchParams={searchParams}
      onUrlUpdate={onUrlUpdate}
      hasMemory
    >
      <NextIntlClientProvider locale="en" messages={messages}>
        <MobileMenu>
          <MobileMenuTrigger />
          <MobileMenuArea>
            <p>Map content</p>
          </MobileMenuArea>
        </MobileMenu>
      </NextIntlClientProvider>
    </NuqsTestingAdapter>,
  );
  return { onUrlUpdate };
};

describe("@containers/mobile-menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsMobile).mockReturnValue(true);
    forgetMenuEntry();
    window.history.replaceState(null, "", "/");
  });

  it("closes a menu opened from a link in place instead of going back", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/?menu=true");
    const { onUrlUpdate } = renderMenu("?menu=true");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(mockBack).not.toHaveBeenCalled();
    const update = onUrlUpdate.mock.lastCall?.[0];
    expect(update?.searchParams.has("menu")).toBe(false);
    expect(update?.options.history).toBe("replace");
  });

  it("goes back to remove the history entry the menu pushed", async () => {
    const user = userEvent.setup();
    const { onUrlUpdate } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onUrlUpdate.mock.lastCall?.[0].options.history).toBe("push");
    window.history.replaceState(null, "", "/?menu=true");
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(mockBack).toHaveBeenCalledOnce();
  });

  it("closes in place when the pushed entry has not reached the URL yet", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes in place when Resources has no page yet", async () => {
    const user = userEvent.setup();
    const { onUrlUpdate } = renderMenu("?menu=true");

    await user.click(screen.getByRole("link", { name: "Resources" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onUrlUpdate.mock.lastCall?.[0].options.history).toBe("replace");
  });

  it("does not switch locale when the active language is tapped", async () => {
    const user = userEvent.setup();
    renderMenu("?menu=true");

    await user.click(screen.getByRole("radio", { name: "English" }));

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps the content interactive and the panel closed at desktop width", () => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    renderMenu("?menu=true");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Map content").closest("[inert]")).toBeNull();
  });
});
