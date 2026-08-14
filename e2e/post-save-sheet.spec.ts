import { expect, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

test.describe("the post-save confirmation sheet", () => {
  test("previews the just-saved brew with the shared ratio-summary numbers", async ({ page }) => {
    await saveBrewFromCalculator(page, {
      name: "Sunday Pour",
      type: "V60",
      water: "480",
      keepPostSaveSheetOpen: true,
    });

    const sheet = page.locator("brew-post-save-sheet");
    await expect(sheet.locator(".identity-name")).toHaveText("Sunday Pour");
    await expect(sheet.locator("brew-ratio-summary .ratio-value")).toHaveText("1:16");
    await expect(sheet.locator("brew-ratio-summary .stat-value")).toHaveText([
      "30g",
      "480g",
      "16.93oz",
    ]);
  });

  test("closing the sheet returns to a blank Calculator", async ({ page }) => {
    await saveBrewFromCalculator(page, {
      name: "Sunday Pour",
      type: "V60",
      water: "480",
      keepPostSaveSheetOpen: true,
    });

    await page.locator("brew-post-save-sheet").getByRole("button", { name: "Close" }).click();

    await expect(page.locator("brew-post-save-sheet brew-bottom-sheet[open]")).toHaveCount(0);
    const waterInput = page.getByLabel("Water (g)", { exact: true });
    if (!(await waterInput.isVisible())) {
      await page.locator('brew-type-picker brew-chip[label="V60"]').click();
    }
    await expect(waterInput).toHaveValue("");
  });

  test("Go to brew detail navigates to the saved brew's detail screen", async ({ page }) => {
    await saveBrewFromCalculator(page, {
      name: "Sunday Pour",
      type: "V60",
      water: "480",
      keepPostSaveSheetOpen: true,
    });

    await page
      .locator("brew-post-save-sheet")
      .getByRole("button", { name: "Go to brew detail" })
      .click();

    await expect(page).toHaveURL(/\/saved\/\d+$/);
    await expect(page.locator("brew-top-bar .title")).toHaveText("Sunday Pour");
    await expect(page.locator("saved-detail-page brew-ratio-summary .ratio-value")).toHaveText(
      "1:16",
    );
  });

  test("Start guided timer primes and navigates to the timer with this brew's recipe", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, {
      name: "Sunday Pour",
      type: "V60",
      water: "480",
      keepPostSaveSheetOpen: true,
    });

    await page
      .locator("brew-post-save-sheet")
      .getByRole("button", { name: "Start guided timer" })
      .click();

    await expect(page).toHaveURL("/timer");
    await expect(page.locator(".recipe-caption-name")).toHaveText("Sunday Pour · 1:16");
    await expect(page.locator(".recipe-caption-detail")).toHaveText("30g coffee · 480g water");
  });
});
