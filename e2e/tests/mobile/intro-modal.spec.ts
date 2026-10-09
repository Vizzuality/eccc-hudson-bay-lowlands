import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Mobile intro modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/en");
  });

  test("hides the beta banner until Got it is pressed", async ({ page }) => {
    const modal = page.getByRole("dialog", {
      name: "Discover the Hudson & James Bay region",
    });
    const banner = page.getByText("We're in Beta!");

    await expect(modal).toBeVisible();
    await expect(banner).toBeHidden();

    await modal.getByRole("button", { name: "Got it" }).click();

    await expect(modal).toBeHidden();
    await expect(banner).toBeVisible();
  });

  test("does not show again after Got it", async ({ page }) => {
    const modal = page.getByRole("dialog", {
      name: "Discover the Hudson & James Bay region",
    });

    await modal.getByRole("button", { name: "Got it" }).click();
    await expect(modal).toBeHidden();

    await page.reload();

    await expect(page.getByText("We're in Beta!")).toBeVisible();
    await expect(modal).toBeHidden();
  });
});
