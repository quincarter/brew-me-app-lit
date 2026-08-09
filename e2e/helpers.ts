import type { Page } from "@playwright/test";

export interface ISaveBrewOptions {
  name?: string;
  type?: string;
  water?: string;
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
};
