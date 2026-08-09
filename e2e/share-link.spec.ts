import { expect, test } from "@playwright/test";

test.describe("opening a shared brew link", () => {
  test("renders the shared brew and saves it to my brews", async ({ page }) => {
    await page.goto(
      "/share?brewType=V60&ratio=16&water=300&coffee=18.75&oz=10.58&name=Sunday%20Morning%20Pour",
    );

    await expect(page.locator("brew-top-bar .title")).toHaveText("Sunday Morning Pour");
    await expect(page.locator(".brew-type-subtitle")).toHaveText("V60");
    await expect(page.getByRole("link", { name: /V60 Brew Guide/ })).toBeVisible();

    await page.getByRole("button", { name: "Save to my brews" }).click();
    await expect(page.getByRole("button", { name: "Saved to your brews" })).toBeVisible();

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText(
      "Sunday Morning Pour · 16:1",
    );
  });
});
