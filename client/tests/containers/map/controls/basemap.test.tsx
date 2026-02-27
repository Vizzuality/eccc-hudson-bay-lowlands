import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useMapBasemap } from "@/app/[locale]/url-store";
import { BASEMAPS } from "@/containers/map/constants";
import { BasemapControl } from "@/containers/map/controls/settings/basemap";
import messages from "@/i18n/messages/en.json";

vi.mock("@/app/[locale]/url-store", () => ({
  useMapBasemap: vi.fn(),
}));

vi.mock("@/containers/map/constants", () => ({
  BASEMAPS: {
    light: { id: "light", name: "Light", image: "/light.png" },
    satellite: { id: "satellite", name: "Satellite", image: "/satellite.png" },
  },
}));

const mockSetBasemap = vi.fn();

function setupHooks(basemap = "light") {
  (useMapBasemap as Mock).mockReturnValue({
    basemap,
    setBasemap: mockSetBasemap,
  });
}

const renderBasemapControl = () => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BasemapControl />
    </NextIntlClientProvider>,
  );
};

describe("@containers/map/controls/settings/basemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a button for each basemap option", () => {
    setupHooks();
    renderBasemapControl();

    for (const b of Object.values(BASEMAPS)) {
      expect(
        screen.getByRole("button", { name: new RegExp(b.name) }),
      ).toBeInTheDocument();
    }
  });

  it("highlights the active basemap", () => {
    setupHooks("light");
    renderBasemapControl();

    const lightBtn = screen.getByRole("button", { name: /Light/ });
    expect(lightBtn.className).toContain("bg-blue-500/25");

    const satelliteBtn = screen.getByRole("button", { name: /Satellite/ });
    expect(satelliteBtn.className).not.toContain("bg-blue-500/25");
  });

  it("calls setBasemap when a different basemap is clicked", async () => {
    setupHooks("light");
    const user = userEvent.setup();
    renderBasemapControl();

    await user.click(screen.getByRole("button", { name: /Satellite/ }));

    expect(mockSetBasemap).toHaveBeenCalledWith("satellite");
  });

  it("highlights satellite when it is the active basemap", () => {
    setupHooks("satellite");
    renderBasemapControl();

    const satelliteBtn = screen.getByRole("button", { name: /Satellite/ });
    expect(satelliteBtn.className).toContain("bg-blue-500/25");

    const lightBtn = screen.getByRole("button", { name: /Light/ });
    expect(lightBtn.className).not.toContain("bg-blue-500/25");
  });
});
