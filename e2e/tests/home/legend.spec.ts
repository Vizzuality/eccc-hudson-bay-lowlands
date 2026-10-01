import { expect, test } from "@playwright/test";

const ACTIVE_LAYER = "layers=nativeland.4pgB_next_nld_terr_prod_layer";

test.describe("Map legend", () => {
  test("the open legend trigger is named in English", async ({ page }) => {
    await page.goto(`http://localhost:3000/en?${ACTIVE_LAYER}`);

    await expect(page.getByRole("button", { name: "Legend" })).toBeVisible();
  });

  test("the open legend trigger is named in French", async ({ page }) => {
    await page.goto(`http://localhost:3000/fr?${ACTIVE_LAYER}`);

    await expect(page.getByRole("button", { name: "Légende" })).toBeVisible();
  });
});
