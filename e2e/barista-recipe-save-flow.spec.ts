import { expect, test } from "@playwright/test";

const BREW_TYPES_WITH_RECIPES = [
  "Chemex",
  "Aeropress",
  "Clever Dripper",
  "Hario Switch",
  "Kalita Wave",
  "Origami",
  "V60",
];

test.describe("Barista recipe save flow", () => {
  for (const brewType of BREW_TYPES_WITH_RECIPES) {
    test(`loads and saves a ${brewType} barista recipe`, async ({ page }) => {
      // 1. Navigate directly to /calculate
      await page.goto("/calculate");

      // 2. Tap {brewType} chip in <brew-type-picker>
      await page.locator(`brew-type-picker brew-chip[label="${brewType}"]`).click();

      // 3. Tap the "Load ..." recipe button
      await page.locator("brew-button", { hasText: "Load" }).click();

      // 4. Tap the 3rd recipe item in <brew-recipe-picker-sheet>
      await page.locator("brew-recipe-picker-sheet brew-list-row").nth(2).click();

      // 5. Tap 'Save' on the Calculator screen
      await page.getByRole("button", { name: "Save", exact: true }).click();

      // 6. Enter a brew name (e.g. Test {brewType})
      const testBrewName = `Test ${brewType}`;
      await page.getByLabel("Brew name", { exact: true }).fill(testBrewName);

      // 7. Assert that the {brewType} chip in <brew-save-sheet> is already selected
      await expect(
        page.locator(`brew-save-sheet brew-chip[label="${brewType}"][selected]`),
      ).toBeVisible();

      // 8. Tap 'Save' in <brew-save-sheet>
      await page.locator("brew-save-sheet").getByRole("button", { name: "Save", exact: true }).click();

      // 9. Tap 'Go to brew detail' in <brew-post-save-sheet>
      await page
        .locator("brew-post-save-sheet")
        .getByRole("button", { name: "Go to brew detail" })
        .click();

      // 10. Assert URL matches /saved/ and verify brew display name and ratio on the detail page
      await expect(page).toHaveURL(/\/saved\/\d+$/);
      await expect(page.locator("brew-top-bar .title")).toHaveText(testBrewName);
      await expect(
        page.locator("saved-detail-page brew-ratio-summary .ratio-value"),
      ).toHaveText(/1:\d+/);
    });
  }
});
