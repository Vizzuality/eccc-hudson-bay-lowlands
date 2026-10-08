import { expect, test } from "@playwright/test";

const ACTIVE_LAYER = "layers=nativeland.4pgB_next_nld_terr_prod_layer";

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

  test("active layers stay on after opening and closing the view", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/en?${ACTIVE_LAYER}`);
    const nav = page.getByRole("navigation", { name: "Map views" });

    await nav.getByRole("button", { name: "Data" }).click();
    await expect(page).toHaveURL(/[?&]view=data/);
    await nav.getByRole("button", { name: "Map" }).click();

    await expect(page).not.toHaveURL(/[?&]view=/);
    await expect(page).toHaveURL(new RegExp(`[?&]${ACTIVE_LAYER}`));
    await page.getByRole("button", { name: "Map legend" }).click();
    await expect(
      page
        .getByRole("dialog", { name: "Map Legend" })
        .getByRole("heading", { level: 2 }),
    ).toHaveCount(2);
  });
});
