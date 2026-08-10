import { expect, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

test.describe("saving a brew from the Calculator", () => {
  test("saves a custom-named brew and shows it on Saved and Home", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("Sunday Morning Pour · 1:16");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator("brew-saved-card .type")).toHaveText("Sunday Morning Pour");
  });

  test("falls back to the brew type name when the name field is left blank", async ({ page }) => {
    await saveBrewFromCalculator(page, { type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("V60 · 1:16");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator("brew-saved-card .type")).toHaveText("V60");
  });
});
