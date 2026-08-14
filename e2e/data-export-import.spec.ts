import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { saveBrewFromCalculator } from "./helpers";

/** A real export captured from the app, checked in as starter data for import tests. */
const REAL_EXPORT_FIXTURE = path.resolve(process.cwd(), "e2e/brew-me-export-2026-08-09.json");

test.describe("exporting saved data", () => {
  test("downloads a JSON file whose contents match what's saved", async ({ page }) => {
    await saveBrewFromCalculator(page, {
      name: "Export Me",
      type: "V60",
      water: "300",
    });

    await page.goto("/more/settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export data" }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^brew-me-export-\d{4}-\d{2}-\d{2}\.json$/);

    const filePath = await download.path();
    if (!filePath) throw new Error("Download did not save to disk.");
    const payload: {
      app: string;
      data: {
        "saved-brews": { brewType: string; name?: string; water: number }[];
      };
    } = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    expect(payload.app).toBe("brew-me");
    expect(payload.data["saved-brews"]).toHaveLength(1);
    expect(payload.data["saved-brews"][0]).toMatchObject({
      brewType: "V60",
      name: "Export Me",
      water: 300,
    });
  });
});

test.describe("importing saved data", () => {
  test("restores saved brews, ratings, and custom brew types from a real exported file", async ({
    page,
  }) => {
    await page.goto("/more/settings");

    await page.locator('input[type="file"]').setInputFiles(REAL_EXPORT_FIXTURE);
    await expect(
      page.locator(".section-hint").filter({ hasText: "brew-me-export-2026-08-09.json" }),
    ).toBeVisible();

    await Promise.all([
      page.waitForLoadState("load"),
      page.getByRole("button", { name: "Yes, import and replace" }).click(),
    ]);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row")).toHaveCount(9);
    await expect(page.locator("brew-list-row").filter({ hasText: "Quin's Chemex" })).toBeVisible();

    await page.goto("/saved/1786128256329");
    await expect(page.locator("brew-top-bar .title")).toHaveText("Chemex");
    await expect(page.locator("brew-star-rating .star.filled")).toHaveCount(4);
    await expect(page.locator(".tasting-note")).toHaveText('"Fruity and tea like"');

    await page.goto("/more/settings");
    await expect(page.locator(".type-tag.custom")).toContainText("Nitro Cold Brew");
  });

  test("rejects an invalid file and leaves existing data untouched", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Keep Me", type: "V60" });

    await page.goto("/more/settings");
    await page.locator('input[type="file"]').setInputFiles({
      name: "not-an-export.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ not valid json"),
    });
    await page.getByRole("button", { name: "Yes, import and replace" }).click();

    await expect(page.getByText("Couldn't import — check the file and try again.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yes, import and replace" })).toHaveCount(0);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row")).toHaveCount(1);
    await expect(page.locator("brew-list-row .headline")).toHaveText("Keep Me · 1:16");
  });

  test("canceling an import leaves existing data untouched", async ({ page }) => {
    await saveBrewFromCalculator(page, { name: "Keep Me", type: "V60" });

    await page.goto("/more/settings");
    await page.locator('input[type="file"]').setInputFiles(REAL_EXPORT_FIXTURE);
    await expect(page.getByRole("button", { name: "Yes, import and replace" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Yes, import and replace" })).toHaveCount(0);

    await page.locator("brew-bottom-nav").getByRole("link", { name: "Saved" }).click();
    await expect(page.locator("brew-list-row")).toHaveCount(1);
    await expect(page.locator("brew-list-row .headline")).toHaveText("Keep Me · 1:16");
  });
});
