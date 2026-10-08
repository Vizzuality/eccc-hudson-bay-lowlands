import { expect, test } from "@playwright/test";

const ACTIVE_LAYER = "layers=nativeland.4pgB_next_nld_terr_prod_layer";

test.describe("Mobile map legend", () => {
  test("the legend button opens the sheet for the active layers", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/en?${ACTIVE_LAYER}`);

    await expect(
      page.getByRole("button", { name: "Legend", exact: true }),
    ).toBeHidden();

    await page.getByRole("button", { name: "Map legend" }).click();

    const sheet = page.getByRole("dialog", { name: "Map Legend" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("No active layers")).toBeHidden();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("the sheet shows an empty state with no active layers", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/en");

    await page.getByRole("button", { name: "Map legend" }).click();

    await expect(
      page
        .getByRole("dialog", { name: "Map Legend" })
        .getByText("No active layers"),
    ).toBeVisible();
  });

  test("the map download button is hidden", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    await expect(
      page.getByRole("button", { name: "Map legend" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download map image" }),
    ).toBeHidden();
  });
});
