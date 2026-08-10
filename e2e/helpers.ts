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

  await page.goto("/calculate");
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
