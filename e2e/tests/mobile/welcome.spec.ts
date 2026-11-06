import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Mobile welcome card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/en");
  });

  test("hides the beta banner until Skip for now is pressed", async ({
    page,
  }) => {
    const welcome = page.getByRole("dialog", {
      name: "Explore and analyze the Hudson & James Bay region",
    });
    const banner = page.getByText("We're in Beta!");

    await expect(welcome).toBeVisible();
    await expect(banner).toBeHidden();

    await welcome.getByRole("button", { name: "Skip for now" }).click();

    await expect(welcome).toBeHidden();
    await expect(banner).toBeVisible();
  });

  test("does not show again after Skip for now", async ({ page }) => {
    const welcome = page.getByRole("dialog", {
      name: "Explore and analyze the Hudson & James Bay region",
    });

    await welcome.getByRole("button", { name: "Skip for now" }).click();
    await expect(welcome).toBeHidden();

    await page.reload();

    await expect(page.getByText("We're in Beta!")).toBeVisible();
    await expect(welcome).toBeHidden();
  });
});
