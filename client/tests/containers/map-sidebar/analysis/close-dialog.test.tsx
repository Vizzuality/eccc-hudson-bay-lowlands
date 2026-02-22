import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CloseDialog from "@/containers/map-sidebar/analysis/close-dialog";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: mockPush })),
}));

describe("@containers/map-sidebar/analysis/close-dialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders dialog content when open", () => {
		render(<CloseDialog open={true} onOpenChange={vi.fn()} />);

		expect(
			screen.getByRole("dialog", { name: /leave current analysis/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/going back will clear your current analysis/i),
		).toBeInTheDocument();
	});

	it("does not render dialog content when closed", () => {
		render(<CloseDialog open={false} onOpenChange={vi.fn()} />);

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("calls onOpenChange(false) when Cancel is clicked", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(<CloseDialog open={true} onOpenChange={onOpenChange} />);

		const dialog = screen.getByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: /cancel/i }),
		);

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("navigates to root and closes dialog when 'Clear & go back' is clicked", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(<CloseDialog open={true} onOpenChange={onOpenChange} />);

		const dialog = screen.getByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: /clear & go back/i }),
		);

		expect(mockPush).toHaveBeenCalledWith("/");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
