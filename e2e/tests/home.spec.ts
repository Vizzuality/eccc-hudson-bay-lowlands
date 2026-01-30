import { expect, test } from "@playwright/test";

test("has correct title", async ({ page }) => {
	await page.goto("http://localhost:3000");

	await expect(page).toHaveTitle(/Discover the Hudson & James bay region/);
});
