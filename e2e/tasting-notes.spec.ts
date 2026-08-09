import { expect, type Page, test } from "@playwright/test";
import { saveBrewFromCalculator } from "./helpers";

const rateAndAddNote = async (page: Page): Promise<void> => {
  await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
  await page.locator("brew-list-row").click();
  await page.getByRole("button", { name: "Edit ratio" }).click();
  await page.locator("brew-star-rating[editable] .star").nth(3).click();
  await page.getByLabel("Tasting note", { exact: true }).fill("Bright and juicy");
  await page.getByRole("button", { name: "Save changes" }).click();
};

test.describe("rating and tasting notes on a saved brew", () => {
  test("shows the rating and tasting note on the detail page, Saved list, and Home", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Rated Brew", type: "V60" });
    await rateAndAddNote(page);

    await expect(page.locator("brew-star-rating .star.filled")).toHaveCount(4);
    await expect(page.locator("brew-star-rating .star")).toHaveCount(5);
    await expect(page.locator(".tasting-note")).toHaveText("Bright and juicy");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .star.filled")).toHaveCount(4);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator("brew-saved-card .star.filled")).toHaveCount(4);
  });

  test("clears the rating and tasting note back to their unset state everywhere", async ({
    page,
  }) => {
    await saveBrewFromCalculator(page, { name: "Rated Brew", type: "V60" });
    await rateAndAddNote(page);

    await page.getByRole("button", { name: "Edit ratio" }).click();
    await page.locator("brew-star-rating[editable] .star").nth(3).click();
    await page.getByLabel("Tasting note", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.locator("brew-star-rating")).toHaveCount(0);
    await expect(page.locator(".tasting-note")).toHaveCount(0);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row brew-star-rating")).toHaveCount(0);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();
    await expect(page.locator("brew-saved-card brew-star-rating")).toHaveCount(0);
  });

  test("toggles the theme while keeping saved brew content visible", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Theme Check Brew", type: "V60" });

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("Theme Check Brew · 16:1");

    const before = await page.locator("html").getAttribute("data-theme");
    await page
      .locator("brew-theme-toggle")
      .getByRole("button", { name: "Toggle dark mode" })
      .click();
    const after = await page.locator("html").getAttribute("data-theme");
    expect(after).not.toBe(before);

    await expect(page.locator("brew-list-row .headline")).toHaveText("Theme Check Brew · 16:1");
  });
});
