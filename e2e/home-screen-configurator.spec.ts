import { expect, type Page, test } from "@playwright/test";

const rowTitles = (page: Page): Promise<(string | null)[]> =>
  page.locator("brew-home-screen-config-row").evaluateAll((rows) => rows.map((r) => r.title));

/** Drags `title`'s row handle up by `slots` rows, one pointer gesture per slot - matches how a person drags one slot, releases, and drags again, rather than a single continuous multi-slot drag. */
const dragRowUpOneSlot = async (page: Page, title: string): Promise<void> => {
  const row = page.locator("brew-home-screen-config-row").filter({ hasText: title });
  const handle = row.locator(".drag-handle");
  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error(`expected a bounding box for ${title}'s drag handle`);

  const rowAbove = row.locator("xpath=preceding-sibling::brew-home-screen-config-row[1]");
  const aboveBox = await rowAbove.boundingBox();
  if (!aboveBox) throw new Error(`expected a row above ${title} to drag past`);

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const targetY = aboveBox.y + aboveBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Several small steps with brief pauses, like a real drag gesture - fast
  // enough to finish quickly, slow enough for the FLIP slide animation on
  // the row being dragged past to actually be mid-flight at least once,
  // which is what the regression below depends on exercising.
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const y = startY + ((targetY - startY) * i) / steps;
    await page.mouse.move(startX, y, { steps: 3 });
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
};

test.describe("Home Screen Configurator drag-to-reorder", () => {
  test("dragging the second row up one slot moves it to the top and keeps it there", async ({
    page,
  }) => {
    await page.goto("/more/settings/home-screen");

    const before = await rowTitles(page);
    const secondRowTitle = before[1];
    if (!secondRowTitle) throw new Error("expected a second row");

    await dragRowUpOneSlot(page, secondRowTitle);

    // Regression: this exact one-slot move previously oscillated (the FLIP
    // animation on the row it swapped past made `elementFromPoint` report a
    // stale mid-slide position, so a subsequent pointermove while the
    // pointer lingered near the boundary undid the swap) - asserting the
    // final settled order, not just an intermediate one, is the point.
    await expect
      .poll(() => rowTitles(page), { timeout: 2000 })
      .toEqual([secondRowTitle, before[0], ...before.slice(2)]);
  });

  test("dragging a row down one slot moves it down and keeps it there", async ({ page }) => {
    await page.goto("/more/settings/home-screen");

    const before = await rowTitles(page);
    const thirdRowTitle = before[2];
    if (!thirdRowTitle) throw new Error("expected a third row");

    // Reuse the same up-drag helper by dragging the row currently *below*
    // the target up into the target's slot - equivalent to dragging the
    // target down one slot, and exercises the same boundary from the other
    // direction.
    const fourthRowTitle = before[3];
    if (!fourthRowTitle) throw new Error("expected a fourth row");
    await dragRowUpOneSlot(page, fourthRowTitle);

    await expect
      .poll(() => rowTitles(page), { timeout: 2000 })
      .toEqual([...before.slice(0, 2), fourthRowTitle, thirdRowTitle, ...before.slice(4)]);
  });
});
