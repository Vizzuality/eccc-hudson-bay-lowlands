import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Analysis from "@/containers/map-sidebar/analysis";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: mockPush })),
}));

describe("@containers/map-sidebar/analysis", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the heading", () => {
		render(<Analysis />);

		expect(
			screen.getByRole("heading", { name: /my area of interest/i }),
		).toBeInTheDocument();
	});

	it("opens the close dialog when the close button is clicked", async () => {
		const user = userEvent.setup();
		render(<Analysis />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button"));

		expect(
			screen.getByRole("dialog", { name: /leave current analysis/i }),
		).toBeInTheDocument();
	});

	it("closes the dialog when Cancel is clicked", async () => {
		const user = userEvent.setup();
		render(<Analysis />);

		await user.click(screen.getByRole("button"));
		const dialog = screen.getByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: /cancel/i }),
		);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
