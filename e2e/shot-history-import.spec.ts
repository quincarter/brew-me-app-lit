import { expect, test } from "@playwright/test";
import * as path from "node:path";
import { importDataFile, stubWebBluetoothSupport } from "./helpers";

/**
 * A real export captured from a connected scale (see the app's Timer Stop/Seal flow) across
 * several saved brews - some brewed multiple times (multiple sealed shots recorded against one
 * saved brew), one saved but never brewed (zero shots). Checked in as fixture data so shot-history
 * coverage exercises real, noisy BLE telemetry shapes rather than synthetic samples.
 */
const SHOT_HISTORY_FIXTURE = path.resolve(
  process.cwd(),
  "e2e/brew-me-export-2026-08-16-data-with-brews-and-shots.json",
);

/** Ground truth read directly from `SHOT_HISTORY_FIXTURE`'s `saved-brews`/`saved-shots`. */
const SAVED_BREW_CASES: {
  id: number;
  label: string;
  noun: "Shots" | "Brews";
  shotCount: number;
}[] = [
  { id: 1786844237737, label: "Espresso Shot, unnamed", noun: "Shots", shotCount: 4 },
  { id: 1786877819002, label: "Ristretto (never brewed)", noun: "Shots", shotCount: 0 },
  { id: 1786927327303, label: "Chemex, unnamed", noun: "Brews", shotCount: 3 },
  { id: 1786927564442, label: "Espresso Shot, unnamed", noun: "Shots", shotCount: 2 },
  { id: 1786927977198, label: "Quin's typical chemex", noun: "Brews", shotCount: 1 },
];

test.describe("shot/brew history from an imported real device export", () => {
  test.beforeEach(async ({ page }) => {
    await stubWebBluetoothSupport(page);
    await importDataFile(page, SHOT_HISTORY_FIXTURE);
  });

  test("brings in all five saved brews from the export", async ({ page }) => {
    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row")).toHaveCount(5);
  });

  for (const { id, label, noun, shotCount } of SAVED_BREW_CASES) {
    test(`renders ${shotCount} recorded ${noun.toLowerCase()} for ${label}`, async ({ page }) => {
      await page.goto(`/saved/${id}`);

      await expect(page.locator(".section-title").filter({ hasText: noun })).toBeVisible();
      await expect(page.locator("brew-shot-list .shot-card")).toHaveCount(shotCount);

      if (shotCount === 0) {
        await expect(page.locator("brew-empty-state")).toContainText(
          `No ${noun.toLowerCase()} recorded yet`,
        );
      }
    });
  }

  test("charts a shot recorded from a real scale capture (hundreds of samples)", async ({
    page,
  }) => {
    // The longest-running sealed shot in the fixture (1786928479724, 145s / 1446 samples) against
    // the "Quin's typical chemex" saved brew - real telemetry, not the 2-point synthetic minimum.
    await page.goto("/saved/1786927977198");

    const shotChart = page.locator("brew-shot-list .shot-chart-svg");
    await expect(shotChart).toBeVisible();
    await expect(shotChart.locator(".shot-series-path.weight")).toHaveAttribute("d", /^M/);
  });
});
