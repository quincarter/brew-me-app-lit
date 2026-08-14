import { expect, test } from "@playwright/test";

const RECIPE_GUIDE_BREW_TYPES = [
  "Aeropress",
  "Chemex",
  "Clever Dripper",
  "Hario Switch",
  "Kalita Wave",
  "Origami",
  "V60",
];

test.describe("Brew Method Guide to Timer flow", () => {
  for (const brewType of RECIPE_GUIDE_BREW_TYPES) {
    test(`navigates from ${brewType} guide to recipe page, starts timer, and cancels back to idle timer`, async ({
      page,
    }) => {
      // 1. Navigate directly to /more
      await page.goto("/more");

      // 2. Scroll to Brew Method Guide section
      const guideSection = page.locator('[data-tour="more-guides-section"]');
      await guideSection.scrollIntoViewIfNeeded();

      // 3. Tap the recipe guide for {brewType}
      await page
        .locator('more-page brew-list-row[href*="/more/guide/"]', { hasText: brewType })
        .click();
      await page.locator('guide-detail-page brew-link-card[href*="-recipes"]').click();

      // 4. On the recipe page, tap the last/bottom recipe item card to expand it
      const lastRecipeCard = page.locator("brew-recipe-card, brew-pourover-recipe-card").last();
      await lastRecipeCard.scrollIntoViewIfNeeded();
      await lastRecipeCard.getByRole("button").first().click();

      // 5. Tap "Brew this recipe now"
      await page.locator("brew-button", { hasText: "Brew this recipe now" }).click();

      // 6. On <brew-post-save-sheet>, tap "Start guided timer"
      await page
        .locator("brew-post-save-sheet")
        .getByRole("button", { name: "Start guided timer" })
        .click();

      // 7. Verify URL is /timer
      await expect(page).toHaveURL("/timer");

      // 8. Tap Play (Start icon button)
      await page.getByRole("button", { name: "Start", exact: true }).click();

      // 9. Tap X / cancel (Clear brew icon button)
      await page.getByRole("button", { name: "Clear brew" }).click();

      // 10. Assert timer display .dial-value is "00:00", no recipe panel is present,
      // and buttons "Start timer now" and "Choose from saved brews" are present
      await expect(page.locator(".dial-value")).toHaveText("00:00");
      await expect(page.locator("brew-timer-recipe-panel")).toHaveCount(0);
      await expect(
        page.locator("brew-timer-controls").getByRole("button", { name: "Start timer now" }),
      ).toBeVisible();
      await expect(
        page
          .locator("brew-timer-controls")
          .getByRole("button", { name: "Choose from saved brews" }),
      ).toBeVisible();
    });
  }
});
