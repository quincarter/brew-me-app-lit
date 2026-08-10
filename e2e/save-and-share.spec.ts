import { expect, test } from "@playwright/test";

test.describe("saving and sharing a brew from the Calculator", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("shows share-specific sheet copy and copies a shareable link on confirm", async ({
    page,
  }) => {
    const brewName = "Sunday Pour";

    await page.goto("/calculate");
    await page.getByLabel("Water (g)", { exact: true }).fill("300");
    await page.getByRole("button", { name: "Share", exact: true }).click();

    await expect(page.locator("brew-save-sheet .title")).toHaveText("Name this brew to share it");
    await expect(page.getByRole("button", { name: "Save & Share" })).toBeVisible();
    await expect(
      page.locator("brew-save-sheet").getByRole("button", { name: "Save", exact: true }),
    ).toHaveCount(0);

    await page.getByLabel("Brew name", { exact: true }).fill(brewName);
    await page.getByRole("button", { name: "V60", exact: true }).click();
    await page.getByRole("button", { name: "Save & Share" }).click();

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row .headline")).toHaveText(`${brewName} · 1:16`);

    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("name=");

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    const url = new URL(clipboardText);
    expect(url.searchParams.get("name")).toBe(brewName);
  });
});
