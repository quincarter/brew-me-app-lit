import { expect, test } from "@playwright/test";

test.describe("empty state before anything has been saved", () => {
  test("shows the empty state on Saved Brews and Home, with stats at zero", async ({ page }) => {
    await page.goto("/saved");

    await expect(page.locator("brew-empty-state")).toBeVisible();
    await expect(page.locator("brew-empty-state .empty-state-message")).toHaveText(
      "No coffee brews yet! Head over to Calculate to add some!",
    );
    const cta = page.getByRole("link", { name: "Calculate a brew" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/calculate");

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Home" }).click();

    await expect(
      page.locator("brew-stat-tile").filter({ hasText: "saved brews" }).locator(".value"),
    ).toHaveText("0");
    await expect(
      page.locator("brew-stat-tile").filter({ hasText: "day streak" }).locator(".value"),
    ).toHaveText("0");
    await expect(page.locator(".recent-empty")).toBeVisible();
  });
});
