import { expect, type Page, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

/** From any screen with the bottom nav visible, reaches Settings via the same in-app links a user would tap - keeps SPA (ephemeral signal) state intact, unlike `page.goto`. */
const goToSettingsViaNav = async (page: Page): Promise<void> => {
  await page.locator("brew-bottom-nav").getByRole("link", { name: "More" }).click();
  await page.locator("more-page brew-list-row").filter({ hasText: "Settings" }).click();
  await expect(page).toHaveURL("/more/settings");
};

/** From Settings, reaches the Timer screen via the same in-app links a user would tap. */
const goToTimerViaNav = async (page: Page): Promise<void> => {
  await page.locator("brew-bottom-nav").getByRole("link", { name: "More" }).click();
  await page.locator("more-page brew-list-row").filter({ hasText: "Pour-over Timer" }).click();
  await expect(page).toHaveURL("/timer");
};

/** Primes the Timer with `name`'s saved brew via the "Choose from saved brews" picker. */
const primeTimerWithSavedBrew = async (page: Page, name: string): Promise<void> => {
  await page.getByRole("button", { name: "Choose from saved brews" }).click();
  await page
    .locator("brew-saved-brew-picker-sheet brew-list-row")
    .filter({ hasText: name })
    .click();
};

/** Scopes to the Settings screen's "Timer" section row identified by its `.row-label` text. */
const timerSettingsRow = (page: Page, label: string) =>
  page.locator(".row").filter({ has: page.locator(".row-label", { hasText: label }) });

test.describe("timer settings", () => {
  test.describe("default count style", () => {
    test("defaults to 'Count down' for a newly-primed recipe with a target duration", async ({
      page,
    }) => {
      await saveBrewFromCalculator(page, { name: "V60 Count Default", type: "V60" });

      await page.goto("/timer");
      await primeTimerWithSavedBrew(page, "V60 Count Default");
      await expect(page.locator(".recipe-caption-name")).toBeVisible();
      await expect(
        page.locator("brew-timer-recipe-panel").locator('brew-chip[label="Count down"]'),
      ).toHaveJSProperty("selected", true);
    });

    test("switching the Settings default to 'Count up' applies to newly-primed recipes, and the Timer's own mode chips can still override a single session without changing the stored default", async ({
      page,
    }) => {
      await saveBrewFromCalculator(page, { name: "V60 Count Up A", type: "V60" });
      await saveBrewFromCalculator(page, { name: "V60 Count Up B", type: "V60" });

      await page.goto("/more/settings");
      const countUpChip = timerSettingsRow(page, "Default count style").locator(
        'brew-chip[label="Count up"]',
      );
      await countUpChip.click();
      await expect(countUpChip).toHaveJSProperty("selected", true);

      await goToTimerViaNav(page);
      await primeTimerWithSavedBrew(page, "V60 Count Up A");
      await expect(page.locator(".recipe-caption-name")).toBeVisible();
      const recipePanel = page.locator("brew-timer-recipe-panel");
      await expect(recipePanel.locator('brew-chip[label="Count up"]')).toHaveJSProperty(
        "selected",
        true,
      );

      // Override for this one session only, via the Timer's own mode chips.
      await recipePanel.locator('brew-chip[label="Count down"]').click();
      await expect(recipePanel.locator('brew-chip[label="Count down"]')).toHaveJSProperty(
        "selected",
        true,
      );

      // Priming a different recipe falls back to the stored default ("Count up"), confirming the
      // session override above didn't mutate the global setting.
      await page.getByRole("button", { name: "Clear brew" }).click();
      await primeTimerWithSavedBrew(page, "V60 Count Up B");
      await expect(recipePanel.locator('brew-chip[label="Count up"]')).toHaveJSProperty(
        "selected",
        true,
      );

      // Settings itself still reflects "Count up" as the stored default, surviving a full reload.
      await page.goto("/more/settings");
      await expect(countUpChip).toHaveJSProperty("selected", true);
    });
  });

  test.describe("show large step banner", () => {
    test("hides the active-step banner for a running guided timer with steps when turned off in Settings, and restores it when turned back on", async ({
      page,
    }) => {
      await saveBrewFromCalculator(page, { name: "V60 Step Banner", type: "V60" });

      await page.goto("/timer");
      await primeTimerWithSavedBrew(page, "V60 Step Banner");
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await expect(page.locator("brew-active-step-banner")).toBeVisible();

      await goToSettingsViaNav(page);
      const bannerRow = timerSettingsRow(page, "Show large step banner");
      const bannerSwitchEl = bannerRow.locator("brew-switch");
      await expect(bannerSwitchEl).toHaveJSProperty("checked", true);
      await bannerRow.getByRole("switch", { name: "Show large step banner" }).click();
      await expect(bannerSwitchEl).toHaveJSProperty("checked", false);

      // The timer keeps running (ephemeral state) across an in-app nav, so this reflects the
      // setting's effect on an already-running session, not just on a freshly-primed one.
      await goToTimerViaNav(page);
      await expect(page.locator("brew-active-step-banner")).toHaveCount(0);

      await goToSettingsViaNav(page);
      await bannerRow.getByRole("switch", { name: "Show large step banner" }).click();
      await expect(bannerSwitchEl).toHaveJSProperty("checked", true);

      await goToTimerViaNav(page);
      await expect(page.locator("brew-active-step-banner")).toBeVisible();
    });
  });
});
