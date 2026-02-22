import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { useMapBasemap } from "@/app/[locale]/url-store";
import { BASEMAPS } from "@/containers/map/constants";
import { BasemapControl } from "@/containers/map/controls/settings/basemap";

vi.mock("@/app/[locale]/url-store", () => ({
	useMapBasemap: vi.fn(),
}));

vi.mock("@/containers/map/constants", () => ({
	BASEMAPS: {
		default: { id: "default", name: "Default" },
		satellite: { id: "satellite", name: "Satellite" },
	},
}));

const mockSetBasemap = vi.fn();

function setupHooks(basemap = "default") {
	(useMapBasemap as Mock).mockReturnValue({
		basemap,
		setBasemap: mockSetBasemap,
	});
}

describe("@containers/map/controls/settings/basemap", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders a button for each basemap option", () => {
		setupHooks();
		render(<BasemapControl />);

		for (const b of Object.values(BASEMAPS)) {
			expect(
				screen.getByRole("button", { name: b.name }),
			).toBeInTheDocument();
		}
	});

	it("highlights the active basemap", () => {
		setupHooks("default");
		render(<BasemapControl />);

		const defaultBtn = screen.getByRole("button", { name: "Default" });
		expect(defaultBtn.className).toContain("bg-blue-500/25");

		const satelliteBtn = screen.getByRole("button", { name: "Satellite" });
		expect(satelliteBtn.className).not.toContain("bg-blue-500/25");
	});

	it("calls setBasemap when a different basemap is clicked", async () => {
		setupHooks("default");
		const user = userEvent.setup();
		render(<BasemapControl />);

		await user.click(screen.getByRole("button", { name: "Satellite" }));

		expect(mockSetBasemap).toHaveBeenCalledWith("satellite");
	});

	it("highlights satellite when it is the active basemap", () => {
		setupHooks("satellite");
		render(<BasemapControl />);

		const satelliteBtn = screen.getByRole("button", { name: "Satellite" });
		expect(satelliteBtn.className).toContain("bg-blue-500/25");

		const defaultBtn = screen.getByRole("button", { name: "Default" });
		expect(defaultBtn.className).not.toContain("bg-blue-500/25");
	});
});
