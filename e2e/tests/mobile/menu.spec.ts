import { expect, test } from "@playwright/test";

test.describe("Mobile menu", () => {
  test("back closes the menu and returns focus to the menu button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/en");
    const menuButton = page.getByRole("button", { name: "Open menu" });

    await menuButton.click();

    await expect(page).toHaveURL(/[?&]menu=true/);
    const closeButton = page.getByRole("button", { name: "Close menu" });
    await expect(closeButton).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("dialog").getByRole("link", { name: "Map" }),
    ).toBeFocused();

    await page.goBack();

    await expect(page).not.toHaveURL(/[?&]menu=/);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("switching language keeps the menu open", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("radio", { name: "French" }).click();

    await expect(page).toHaveURL(/\/fr\?(.*&)?menu=true/);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Carte" })).toBeVisible();

    await page.getByRole("button", { name: "Fermer le menu" }).click();

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/fr(\?|$)/);
    await expect(page).not.toHaveURL(/[?&]menu=/);
  });

  test("closing with X leaves no history entry behind", async ({ page }) => {
    await page.goto("http://localhost:3000/en");
    await page.goto("http://localhost:3000/en?view=data");

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Close menu" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).not.toHaveURL(/[?&]menu=/);

    await page.goBack();

    await expect(page).not.toHaveURL(/[?&]view=data/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
