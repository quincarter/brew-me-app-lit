import { expect, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

test.describe("brewing a saved brew again", () => {
  test("replaying from Saved Brews pre-fills the Calculator with a Loaded from banner", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page
      .locator("brew-list-row")
      .filter({ hasText: "Sunday Morning Pour" })
      .getByRole("button", { name: "Brew again" })
      .click();

    await expect(page).toHaveURL("/calculate");
    await expect(page.locator(".primed-banner-text")).toHaveText("Loaded from Sunday Morning Pour");
    await expect(page.getByLabel("Water (g)", { exact: true })).toHaveValue("300");
  });

  test("Start guided timer routes through the save sheet, then navigates to /timer with a counting-down V60 recipe caption", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page
      .locator("brew-list-row")
      .filter({ hasText: "Sunday Morning Pour" })
      .getByRole("button", { name: "Brew again" })
      .click();

    await page.getByRole("button", { name: "Start guided timer" }).click();

    await expect(page.locator("brew-save-sheet .title")).toHaveText(
      "Name this brew to start your guided brew",
    );
    await page.getByLabel("Brew name", { exact: true }).fill("Sunday Morning Pour");
    await page.getByRole("button", { name: "V60", exact: true }).click();
    await page
      .locator("brew-save-sheet")
      .getByRole("button", { name: "Save & Start Timer" })
      .click();

    await expect(page).toHaveURL("/timer");
    await expect(page.locator(".recipe-caption-name")).toHaveText("Sunday Morning Pour · 1:16");

    const firstReading = await page.locator(".dial-value").textContent();
    await page.getByRole("button", { name: "Play or pause" }).click();

    await expect.poll(async () => page.locator(".dial-value").textContent()).not.toBe(firstReading);
  });

  test("re-brewing an older-saved brew moves it ahead of a more-recently-saved one on Home", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Older Brew", type: "V60" });
    await saveBrewFromCalculator(page, { name: "Newer Brew", type: "Chemex" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator(".brew-again-name")).toHaveText(/Newer Brew/);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await page
      .locator("brew-list-row")
      .filter({ hasText: "Older Brew" })
      .getByRole("button", { name: "Brew again" })
      .click();

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator(".brew-again-name")).toHaveText(/Older Brew/);
  });
});
