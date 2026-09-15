import { expect, test } from "@playwright/test";

test.describe("Map legend", () => {
  test("the open legend trigger is named in English", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    await expect(page.getByRole("button", { name: "Legend" })).toBeVisible();
  });

  test("the open legend trigger is named in French", async ({ page }) => {
    await page.goto("http://localhost:3000/fr");

    await expect(page.getByRole("button", { name: "Légende" })).toBeVisible();
  });
});
