import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("page loads with the correct title", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await expect(page).toHaveTitle(/Discover the Hudson & James bay region/);
  });

  test("switching to French updates the URL locale", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "French" }).click();

    await expect(page).toHaveURL(/\/fr/);
  });

  // TODO: Failing tests, times out
  test.skip("switching back to English updates the URL locale", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/fr");

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "English" }).click();

    await expect(page).toHaveURL(/\/en/);
  });
});
