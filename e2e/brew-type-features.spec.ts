import { expect, type Locator, type Page, test } from "@playwright/test";
import { saveBrewFromCalculator, stubWebBluetoothSupport } from "./helpers";

/** Scopes down to the single "Brew type features" row for `brewType` on the Settings screen. */
const featureRow = (page: Page, brewType: string): Locator =>
  page.locator(".feature-row").filter({
    has: page.locator(".row-label", { hasText: new RegExp(`^${brewType}$`) }),
  });

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

test.describe("brew type feature settings", () => {
  test("toggling 'Show Brews/Shots section' off and back on affects a stock brew type's Saved Detail page", async ({
    page,
  }) => {
    await stubWebBluetoothSupport(page);
    await saveBrewFromCalculator(page, { name: "V60 Feature Toggle", type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page.locator("brew-list-row").click();
    await expect(page).toHaveURL(/\/saved\/\d+/);
    const detailUrl = page.url();

    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toBeVisible();
    await expect(page.locator("brew-shot-list")).toBeVisible();

    await page.goto("/more/settings");
    const v60Row = featureRow(page, "V60");
    await expect(v60Row).toBeVisible();
    await v60Row.getByRole("switch", { name: "Show Brews/Shots section for V60" }).click();
    await expect(v60Row.locator("brew-switch")).toHaveJSProperty("checked", false);

    await page.goto(detailUrl);
    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toHaveCount(0);
    await expect(page.locator("brew-shot-list")).toHaveCount(0);

    await page.goto("/more/settings");
    await featureRow(page, "V60")
      .getByRole("switch", { name: "Show Brews/Shots section for V60" })
      .click();
    await expect(featureRow(page, "V60").locator("brew-switch")).toHaveJSProperty("checked", true);

    await page.goto(detailUrl);
    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toBeVisible();
    await expect(page.locator("brew-shot-list")).toBeVisible();
  });

  test("timer telemetry mode for a stock brew type gates the telemetry row and extraction chart", async ({
    page,
  }) => {
    await stubWebBluetoothSupport(page);
    await saveBrewFromCalculator(page, { name: "Chemex Telemetry", type: "Chemex", water: "400" });

    await page.goto("/timer");
    await primeTimerWithSavedBrew(page, "Chemex Telemetry");
    await expect(page.locator(".recipe-caption-name")).toBeVisible();

    // Default features ("full") show both the gauges and the chart.
    await expect(page.locator(".telemetry-row")).toBeVisible();
    await expect(page.locator("brew-extraction-chart")).toBeVisible();

    await goToSettingsViaNav(page);
    const chemexRow = featureRow(page, "Chemex");
    await chemexRow.getByRole("button", { name: "Off", exact: true }).click();
    await expect(chemexRow.locator('brew-chip[label="Off"]')).toHaveJSProperty("selected", true);

    await goToTimerViaNav(page);
    // The recipe stayed primed (ephemeral, SPA-nav-preserved) - only the feature setting changed.
    await expect(page.locator(".recipe-caption-name")).toBeVisible();
    await expect(page.locator(".telemetry-row")).toHaveCount(0);
    await expect(page.locator("brew-extraction-chart")).toHaveCount(0);

    await goToSettingsViaNav(page);
    await featureRow(page, "Chemex")
      .getByRole("button", { name: "Chart only", exact: true })
      .click();
    await expect(
      featureRow(page, "Chemex").locator('brew-chip[label="Chart only"]'),
    ).toHaveJSProperty("selected", true);

    await goToTimerViaNav(page);
    await expect(page.locator(".telemetry-row")).toHaveCount(0);
    await expect(page.locator("brew-extraction-chart")).toBeVisible();
  });

  test("Aeropress's row is locked on Settings and clicking its controls has no effect", async ({
    page,
  }) => {
    await stubWebBluetoothSupport(page);
    await page.goto("/more/settings");
    const aeropressRow = featureRow(page, "Aeropress");
    await expect(aeropressRow).toBeVisible();
    await expect(
      aeropressRow.getByText("Telemetry can't be tracked for Aeropress yet."),
    ).toBeVisible();

    const aeropressSwitch = aeropressRow.locator("brew-switch");
    const offChip = aeropressRow.locator('brew-chip[label="Off"]');
    const fullChip = aeropressRow.locator('brew-chip[label="Gauges + chart"]');
    const chartOnlyChip = aeropressRow.locator('brew-chip[label="Chart only"]');

    await expect(aeropressSwitch).toHaveJSProperty("disabled", true);
    await expect(aeropressSwitch).toHaveJSProperty("checked", false);
    await expect(offChip).toHaveJSProperty("disabled", true);
    await expect(offChip).toHaveJSProperty("selected", true);
    await expect(fullChip).toHaveJSProperty("disabled", true);
    await expect(fullChip).toHaveJSProperty("selected", false);
    await expect(chartOnlyChip).toHaveJSProperty("disabled", true);
    await expect(chartOnlyChip).toHaveJSProperty("selected", false);

    // Forcing clicks past Playwright's actionability checks still can't flip a native disabled control.
    await aeropressRow
      .getByRole("switch", { name: "Show Brews/Shots section for Aeropress" })
      .click({ force: true });
    await aeropressRow.getByRole("button", { name: "Gauges + chart", exact: true }).click({
      force: true,
    });
    await expect(aeropressSwitch).toHaveJSProperty("checked", false);
    await expect(fullChip).toHaveJSProperty("selected", false);
    await expect(offChip).toHaveJSProperty("selected", true);

    // Same lock holds for a live Aeropress brew, without ever touching Settings for it -
    // it's a hard lock, not a default someone could have (or hasn't yet) overridden.
    await saveBrewFromCalculator(page, { name: "Aeropress Check", type: "Aeropress" });
    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page.locator("brew-list-row").click();
    await expect(page).toHaveURL(/\/saved\/\d+/);
    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toHaveCount(0);
    await expect(page.locator(".section-title").filter({ hasText: "Shots" })).toHaveCount(0);
    await expect(page.locator("brew-shot-list")).toHaveCount(0);

    await page.goto("/timer");
    await primeTimerWithSavedBrew(page, "Aeropress Check");
    await expect(page.locator(".recipe-caption-name")).toBeVisible();
    await expect(page.locator(".telemetry-row")).toHaveCount(0);
    await expect(page.locator("brew-extraction-chart")).toHaveCount(0);
  });

  test("a custom brew type gets unlocked default features and can be toggled end-to-end", async ({
    page,
  }) => {
    const customType = "Vac Pot";

    await stubWebBluetoothSupport(page);
    await page.goto("/more/settings");
    await page.getByRole("button", { name: "Add brew type", exact: true }).click();
    await page.getByLabel("New brew type", { exact: true }).fill(customType);
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(page.locator(".type-tag.custom")).toContainText(customType);

    const customRow = featureRow(page, customType);
    await expect(customRow).toBeVisible();
    await expect(customRow.locator("brew-switch")).toHaveJSProperty("disabled", false);
    await expect(customRow.locator("brew-switch")).toHaveJSProperty("checked", true);
    await expect(customRow.locator('brew-chip[label="Gauges + chart"]')).toHaveJSProperty(
      "selected",
      true,
    );
    await expect(customRow.locator('brew-chip[label="Gauges + chart"]')).toHaveJSProperty(
      "disabled",
      false,
    );
    await expect(customRow.locator('brew-chip[label="Off"]')).toHaveJSProperty("disabled", false);
    await expect(
      customRow.getByText(`Telemetry can't be tracked for ${customType} yet.`),
    ).toHaveCount(0);

    // Save a brew of this brand-new custom type and confirm the default (on) behavior end to end.
    await saveBrewFromCalculator(page, { name: "Vac Pot Brew", type: customType });
    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page.locator("brew-list-row").click();
    await expect(page).toHaveURL(/\/saved\/\d+/);
    const detailUrl = page.url();
    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toBeVisible();
    await expect(page.locator("brew-shot-list")).toBeVisible();

    // Flip its "Show Brews/Shots section" off in Settings and confirm the effect on that live brew.
    await page.goto("/more/settings");
    await featureRow(page, customType)
      .getByRole("switch", { name: `Show Brews/Shots section for ${customType}` })
      .click();
    await expect(featureRow(page, customType).locator("brew-switch")).toHaveJSProperty(
      "checked",
      false,
    );

    await page.goto(detailUrl);
    await expect(page.locator(".section-title").filter({ hasText: "Brews" })).toHaveCount(0);
    await expect(page.locator("brew-shot-list")).toHaveCount(0);
  });
});
