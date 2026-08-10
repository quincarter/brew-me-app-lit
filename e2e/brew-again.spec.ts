import { expect, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

test.describe("brewing a saved brew again", () => {
  test("tapping the Home 'Brew again' card navigates to the brew's detail screen", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await page.locator(".brew-again-card").click();

    await expect(page).toHaveURL(/\/saved\/\d+$/);
    await expect(page.locator("brew-top-bar .title")).toHaveText("Sunday Morning Pour");
  });

  test("tapping the replay button on the Home 'Brew again' card opens the post-save sheet instead of navigating away", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await page.locator(".brew-again-card").getByRole("button", { name: "Brew again" }).click();

    await expect(page).toHaveURL("/");
    const sheet = page.locator("brew-post-save-sheet");
    await expect(sheet.locator(".identity-name")).toHaveText("Sunday Morning Pour");
    await expect(sheet.locator("brew-ratio-summary .ratio-value")).toHaveText("1:16");

    await sheet.getByRole("button", { name: "Go to brew detail" }).click();
    await expect(page).toHaveURL(/\/saved\/\d+$/);
    await expect(page.locator("brew-top-bar .title")).toHaveText("Sunday Morning Pour");
  });

  test("Start guided timer from the post-save sheet navigates straight to /timer, skipping the save form entirely", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Sunday Morning Pour", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await page.locator(".brew-again-card").getByRole("button", { name: "Brew again" }).click();

    await page
      .locator("brew-post-save-sheet")
      .getByRole("button", { name: "Start guided timer" })
      .click();

    await expect(page).toHaveURL("/timer");
    await expect(page.locator(".recipe-caption-name")).toHaveText("Sunday Morning Pour · 1:16");
  });

  test("brewing again from Saved Brews stamps recency without creating a duplicate entry", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Solo Brew", type: "V60", water: "300" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row")).toHaveCount(1);

    await page
      .locator("brew-list-row")
      .filter({ hasText: "Solo Brew" })
      .getByRole("button", { name: "Brew again" })
      .click();

    await expect(page).toHaveURL("/saved");
    const sheet = page.locator("brew-post-save-sheet");
    await expect(sheet.locator(".identity-name")).toHaveText("Solo Brew");
    await sheet.getByRole("button", { name: "Close" }).click();

    await expect(page.locator("brew-list-row")).toHaveCount(1);
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
    await page.locator("brew-post-save-sheet").getByRole("button", { name: "Close" }).click();

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator(".brew-again-name")).toHaveText(/Older Brew/);
  });
});
