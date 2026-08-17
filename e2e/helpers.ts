import type { Page } from "@playwright/test";

export interface ISaveBrewOptions {
  name?: string;
  type?: string;
  water?: string;
  /**
   * Leaves the post-save confirmation sheet open instead of dismissing it -
   * set true when a test wants to interact with it (e.g. its "Go to brew
   * detail" / "Start guided timer" actions). Defaults to false so every
   * other caller lands back on a plain Calculator screen, matching this
   * helper's pre-post-save-sheet behavior.
   */
  keepPostSaveSheetOpen?: boolean;
}

/** Fills out the Calculator screen and drives the plain (non-share) Save sheet flow to completion. */
export const saveBrewFromCalculator = async (
  page: Page,
  options: ISaveBrewOptions = {},
): Promise<void> => {
  const type = options.type ?? "V60";
  const water = options.water ?? "300";

  await openQuickCalculator(page);

  await page.getByLabel("Water (g)", { exact: true }).fill(water);
  await page.getByRole("button", { name: "Save", exact: true }).click();

  if (options.name !== undefined) {
    await page.getByLabel("Brew name", { exact: true }).fill(options.name);
  }
  await page.getByRole("button", { name: type, exact: true }).click();
  await page.locator("brew-save-sheet").getByRole("button", { name: "Save", exact: true }).click();

  if (!options.keepPostSaveSheetOpen) {
    await page.locator("brew-post-save-sheet").getByRole("button", { name: "Close" }).click();
  }
};

export const openQuickCalculator = async (page: Page) => {
  await page.goto("/calculate");
  await page.getByRole("button", { name: "Quick calculator", exact: true }).click();
};

/**
 * The Timer's telemetry row/chart (and Settings' "Connected devices" section, and the Saved
 * Detail Shots/Brews section) are gated on `isWebBluetoothSupported()`, which just checks
 * `"bluetooth" in navigator` - true on real desktop Chrome, but Playwright's bundled open-source
 * Chromium build doesn't ship `navigator.bluetooth` at all, so it's stubbed here rather than
 * skipping telemetry coverage entirely. Must be called before any navigation in the test (it
 * registers via `addInitScript`, applied on every subsequent load).
 */
export const stubWebBluetoothSupport = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    if (!("bluetooth" in navigator)) {
      Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    }
  });
};

/**
 * Drives the Settings screen's "import and replace" flow to completion for `filePath`.
 *
 * Waits on `page.waitForEvent("load")` (registered *before* the click) rather than
 * `page.waitForLoadState("load")` - the latter resolves immediately if the page is already in the
 * "load" state, which it is here (we're sitting on an already-loaded Settings page), so it doesn't
 * actually wait for the reload the confirm button triggers. That race is invisible with tiny
 * fixtures (import finishes fast enough that the reload has usually already started by the time
 * it's checked) but reliably loses - reporting success before real data lands in IndexedDB - once
 * the imported file is large enough (e.g. real device-export fixtures with embedded telemetry
 * samples) that `importAppData` takes real time to parse and persist.
 */
export const importDataFile = async (page: Page, filePath: string): Promise<void> => {
  await page.goto("/more/settings");
  await page.locator('input[type="file"]').setInputFiles(filePath);

  const loaded = page.waitForEvent("load");
  await page.getByRole("button", { name: "Yes, import and replace" }).click();
  await loaded;
};
