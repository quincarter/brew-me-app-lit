import { expect, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

test.describe("renaming a saved brew", () => {
  test("updates the display name on the detail page and Saved list", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Original Name", type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page.locator("brew-list-row").click();

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Brew name", { exact: true }).fill("Renamed Brew");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.locator("brew-top-bar .title")).toHaveText("Renamed Brew");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("Renamed Brew · 1:16");
  });

  test("falls back to the brew type name once the name is cleared", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Original Name", type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page.locator("brew-list-row").click();

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Brew name", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.locator("brew-top-bar .title")).toHaveText("V60");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("V60 · 1:16");
  });
});
