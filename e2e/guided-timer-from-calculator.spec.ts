import { expect, test } from "@playwright/test";

test.describe("starting a guided timer from the Calculator", () => {
  test("routes through the save sheet with guided-timer copy, then navigates to /timer with the named recipe", async ({
    page,
  }) => {
    await page.goto("/calculate");
    await page.getByLabel("Water (g)", { exact: true }).fill("480");
    await page.getByRole("button", { name: "Start guided timer" }).click();

    await expect(page.locator("brew-save-sheet .title")).toHaveText(
      "Name this brew to start your guided brew",
    );
    await expect(page.getByRole("button", { name: "Save & Start Timer" })).toBeVisible();

    await page.getByLabel("Brew name", { exact: true }).fill("Morning V60");
    await page.getByRole("button", { name: "V60", exact: true }).click();
    await page
      .locator("brew-save-sheet")
      .getByRole("button", { name: "Save & Start Timer" })
      .click();

    await expect(page).toHaveURL("/timer");
    await expect(page.locator(".recipe-caption-name")).toHaveText("Morning V60 · 1:16");

    // Saved (not shown via the post-save sheet, since guided-timer intent skips it).
    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText("Morning V60 · 1:16");
  });

  test("does not reset the Calculator's entered numbers, unlike a plain save", async ({ page }) => {
    await page.goto("/calculate");
    await page.getByLabel("Water (g)", { exact: true }).fill("480");
    await page.getByRole("button", { name: "Start guided timer" }).click();

    await page.getByRole("button", { name: "V60", exact: true }).click();
    await page
      .locator("brew-save-sheet")
      .getByRole("button", { name: "Save & Start Timer" })
      .click();
    await expect(page).toHaveURL("/timer");

    await page.goBack();
    await expect(page).toHaveURL("/calculate");
    await expect(page.getByLabel("Water (g)", { exact: true })).toHaveValue("480");
  });
});
