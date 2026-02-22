import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TopBar from "@/containers/top-bar";
import messages from "@/i18n/messages/en.json";
import { usePathname } from "@/i18n/navigation";

vi.mock("@/i18n/navigation", () => ({
	usePathname: vi.fn(() => "/"),
}));

vi.mock("next/link", () => ({
	default: ({
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

		expect(screen.getByText("lowlands spatial data")).toBeInTheDocument();
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
