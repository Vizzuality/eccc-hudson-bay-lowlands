import { expect, test } from "@playwright/test";

test.describe("Mobile data view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/en");
  });

  test("Data opens the data layers view", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Map views" });

    await nav.getByRole("button", { name: "Data" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: /^Data Layers \(\d+\)$/ }),
    ).toBeVisible();
  });

  test("a layer turned on in the view stays on after going back to the map", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Map views" });

    await nav.getByRole("button", { name: "Data" }).click();
    await page.getByRole("button", { name: "Indigenous Territories" }).click();
    await page
      .getByRole("checkbox", { name: "Indigenous Territories" })
      .check();
    await expect(page).toHaveURL(/[?&]layers=/);

    await nav.getByRole("button", { name: "Map" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: /^Data Layers/ }),
    ).toBeHidden();
    await expect(page).toHaveURL(/[?&]layers=/);
    await expect(page.getByRole("button", { name: "Legend" })).toBeVisible();
  });
});
