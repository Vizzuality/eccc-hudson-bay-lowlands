import { expect, test } from "@playwright/test";

test.describe("Mobile layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/en");
  });

  test("shows the bottom nav and hides the sidebar", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Map views" }),
    ).toBeVisible();
    await expect(page.locator("aside")).toBeHidden();
  });

  test("header shows the logo and the menu button only", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "lowlands spatial data" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.getByRole("combobox")).toBeHidden();
  });

  test("Data and Map switch the mobile view", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Map views" });
    const mapItem = nav.getByRole("button", { name: "Map" });
    const dataItem = nav.getByRole("button", { name: "Data" });

    await expect(mapItem).toHaveAttribute("aria-current", "true");

    await dataItem.click();
    await expect(page).toHaveURL(/[?&]view=data/);
    await expect(dataItem).toHaveAttribute("aria-current", "true");
    await expect(mapItem).not.toHaveAttribute("aria-current");

    await mapItem.click();
    await expect(page).not.toHaveURL(/[?&]view=/);
    await expect(mapItem).toHaveAttribute("aria-current", "true");
  });

  test("Analysis starts upload mode and hides the nav", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Map views" });

    await nav.getByRole("button", { name: "Analysis" }).click();

    await expect(page).toHaveURL(/[?&]mapStatus=upload/);
    await expect(nav).toBeHidden();
  });
});
