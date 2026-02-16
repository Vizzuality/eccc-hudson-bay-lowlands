import { expect, test } from "@playwright/test";

test.describe("Analyze", () => {
	test("User can analyze data by uploading a file", async ({ page }) => {
		await page.goto("http://localhost:3000");

		await expect(page).toHaveTitle(/Discover the Hudson & James bay region/);

		await page.getByRole("button", { name: "Analyze area" }).click();

		await page.getByRole("button", { name: "Upload" }).click();

		await page.getByRole("button", { name: "Confirm" }).click();

		await expect(page).toHaveURL(
			"http://localhost:3000/en?mapStatus=analysis&mapShape=true",
		);

		await expect(
			page.getByRole("heading", { name: "My area of interest" }),
		).toBeVisible();
	});
});
