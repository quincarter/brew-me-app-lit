import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import type { IAeropressRecipe, IBrewStep } from "../../../shared/interfaces/brew.interface";
import "../brew-recipe-card";
import type { RecipeCard } from "../RecipeCard";

const recipe: IAeropressRecipe = {
  id: "test-recipe",
  year: 2021,
  place: 1,
  competitor: "Test Competitor",
  country: "Testland",
  setup: { Position: "Inverted", Dose: "18g" },
  steps: ["Pour 100g of water.", "At 30s, stir gently."],
  doseGrams: 18,
  totalWaterGrams: 270,
};

describe("brew-recipe-card", () => {
  let element: RecipeCard;

  beforeEach(async () => {
    element = document.createElement("brew-recipe-card") as RecipeCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when .recipe isn't set", () => {
    expect(element.shadowRoot?.querySelector(".card")).toBeNull();
  });

  it("renders collapsed by default when recipe is set", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
  });

  it("renders expanded when start-open is set", async () => {
    // startOpen only seeds the initial expanded state on connect, so it
    // must be set before the element is attached to the DOM.
    element.remove();
    element = document.createElement("brew-recipe-card") as RecipeCard;
    element.startOpen = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
  });

  it("toggles expanded state when the header is clicked", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();

    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
  });

  it("dispatches brew-now with the recipe when 'Brew this recipe now' is clicked", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    header.click();
    await element.updateComplete;

    const brewButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.replace(/\s+/g, " ").includes("Brew this recipe now"),
    );
    expect(brewButton).not.toBeUndefined();

    const innerButton = brewButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the brew-button's inner button");

    const brewNowEvent = new Promise<CustomEvent<IAeropressRecipe>>((resolve) => {
      element.addEventListener("brew-now", (event) =>
        resolve(event as CustomEvent<IAeropressRecipe>),
      );
    });

    innerButton.click();

    const event = await brewNowEvent;
    expect(event.detail).toEqual(recipe);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("omits the brew button when hide-brew-button is set", async () => {
    element.remove();
    element = document.createElement("brew-recipe-card") as RecipeCard;
    element.startOpen = true;
    element.hideBrewButton = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    const brewButton = element.shadowRoot?.querySelector("brew-button");
    expect(brewButton).toBeNull();
  });

  describe("diffAgainst", () => {
    // A real curated recipe (World AeroPress Championship 2022, 1st place)
    // with both a realistic Setup table (6 keys) and hand-curated
    // `timedSteps` (5 method phases), so the Setup/Method split - and the
    // Method section's filtering-out of setup-prefixed rows - is exercised
    // against real data rather than a hand-rolled minimal fixture.
    const diffRecipe = AEROPRESS_RECIPES.find(
      (candidate) => candidate.id === "2022-1",
    ) as IAeropressRecipe;

    if (!diffRecipe) throw new Error("expected AEROPRESS_RECIPES to contain '2022-1'");

    const originalTimedSteps = diffRecipe.timedSteps as IBrewStep[];

    // A single diffAgainst fixture exercising every diff state at once:
    // - Setup: "Dose" changed (18g -> 20g), "Total time" removed, everything
    //   else unchanged.
    // - Method: "flip" removed, "press" changed (30s -> 45s duration), a new
    //   "rest" step added, "pour-stir"/"cap"/"bypass" unchanged.
    const diffAgainst: IBrewStep[] = [
      { id: "2022-1-setup-Position", label: "Position", kind: "note", value: "Inverted" },
      { id: "2022-1-setup-Dose", label: "Dose", kind: "note", value: "20g" },
      {
        id: "2022-1-setup-Filter",
        label: "Filter",
        kind: "note",
        value: "1 AeroPress Classic, rinsed",
      },
      {
        id: "2022-1-setup-Grind",
        label: "Grind",
        kind: "note",
        value: diffRecipe.setup.Grind,
      },
      { id: "2022-1-setup-Water", label: "Water", kind: "note", value: diffRecipe.setup.Water },
      // "2022-1-setup-Total time" intentionally omitted (removed).
      originalTimedSteps[0], // pour-stir, unchanged
      originalTimedSteps[1], // cap, unchanged
      // "2022-1-flip" intentionally omitted (removed).
      { ...originalTimedSteps[3], seconds: 45 }, // press, changed
      originalTimedSteps[4], // bypass, unchanged
      { id: "2022-1-rest", label: "Rest", kind: "timed", seconds: 10 }, // added
    ];

    const setupRow = (key: string): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll(".setup-row") ?? []).find(
        (row) => row.querySelector("dt")?.textContent?.trim() === key,
      );

    const methodRows = (): HTMLLIElement[] =>
      Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []);

    beforeEach(async () => {
      element.remove();
      element = document.createElement("brew-recipe-card") as RecipeCard;
      element.startOpen = true;
      element.recipe = diffRecipe;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    it("with diffAgainst unset, renders no diff classes/badges anywhere (regression guard)", () => {
      expect(element.shadowRoot?.querySelector(".setup-row-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".setup-row-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-added")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".diff-badge")).toBeNull();
      // Raw prose steps render 1:1 - not the curated timedSteps.
      expect(methodRows()).toHaveLength(diffRecipe.steps.length);
    });

    it("a changed setup value renders old -> new with a Changed badge; other setup rows are unaffected", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const doseRow = setupRow("Dose");
      expect(doseRow).not.toBeUndefined();
      expect(doseRow?.classList.contains("setup-row-changed")).toBe(true);
      expect(doseRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("18g");
      expect(doseRow?.querySelector(".diff-new")?.textContent?.trim()).toBe("20g");
      expect(doseRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Changed");

      const positionRow = setupRow("Position");
      expect(positionRow?.classList.contains("setup-row-changed")).toBe(false);
      expect(positionRow?.classList.contains("setup-row-removed")).toBe(false);
      expect(positionRow?.querySelector(".diff-badge")).toBeNull();
    });

    it("a removed setup id renders struck-through with a Removed badge, showing the original value", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const totalTimeRow = setupRow("Total time");
      expect(totalTimeRow).not.toBeUndefined();
      expect(totalTimeRow?.classList.contains("setup-row-removed")).toBe(true);
      expect(totalTimeRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("2:10");
      expect(totalTimeRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Removed");
    });

    it("a changed method step shows its current diffAgainst duration (via formatSeconds) with a Changed badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const pressRow = methodRows().find(
        (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Press",
      );
      expect(pressRow).not.toBeUndefined();
      expect(pressRow?.classList.contains("step-changed")).toBe(true);
      expect(pressRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("00:45");
      expect(pressRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Changed");
    });

    it("a removed method step shows struck-through original canonical values, in its original position among the other rows", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      const labels = rows.map((row) => row.querySelector(".step-line-label")?.textContent?.trim());
      // Canonical order is pour-stir, cap, flip, press, bypass, then any
      // added rows appended - "flip" (removed) stays in its own slot rather
      // than being dropped or moved to the end.
      expect(labels).toEqual([
        "Pour & stir",
        "Cap & degas",
        "Flip",
        "Press",
        "Bypass & serve",
        "Rest",
      ]);

      const flipRow = rows.find(
        (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Flip",
      );
      expect(flipRow?.classList.contains("step-removed")).toBe(true);
      expect(flipRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("00:10");
      expect(flipRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Removed");
    });

    it("an added method step (present in diffAgainst, absent from the canonical list) is appended at the end with an Added badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      const lastRow = rows[rows.length - 1];
      expect(lastRow.querySelector(".step-line-label")?.textContent?.trim()).toBe("Rest");
      expect(lastRow.classList.contains("step-added")).toBe(true);
      expect(lastRow.querySelector(".step-line-value")?.textContent?.trim()).toBe("00:10");
      expect(lastRow.querySelector(".diff-badge")?.textContent?.trim()).toBe("Added");
    });

    it("bug-fix regression guard: the Method section never contains a row for a setup key", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      // 5 canonical brew-only steps (pour-stir, cap, flip, press, bypass) + 1
      // added ("rest") = 6 - never 6 (brew) + 6 (setup) = 12.
      expect(rows).toHaveLength(6);

      const setupKeys = Object.keys(diffRecipe.setup);
      const methodLabels = rows.map((row) =>
        row.querySelector(".step-line-label")?.textContent?.trim(),
      );
      for (const key of setupKeys) {
        expect(methodLabels).not.toContain(key);
      }
    });

    describe("moved rows", () => {
      const setupRowsUnchanged = (): IBrewStep[] =>
        Object.entries(diffRecipe.setup).map(([key, value]) => ({
          id: `${diffRecipe.id}-setup-${key}`,
          label: key,
          kind: "note",
          value,
        }));

      it("flags only the relocated Method row as moved when only the order changed (no content edits, no add/remove)", async () => {
        const reorderOnlyDiffAgainst: IBrewStep[] = [
          ...setupRowsUnchanged(),
          originalTimedSteps[0], // pour-stir
          originalTimedSteps[2], // flip, moved ahead of cap
          originalTimedSteps[1], // cap
          originalTimedSteps[3], // press
          originalTimedSteps[4], // bypass
        ];
        element.diffAgainst = reorderOnlyDiffAgainst;
        await element.updateComplete;

        const rows = methodRows();
        const flipRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Flip",
        );
        const capRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Cap & degas",
        );
        const pourStirRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Pour & stir",
        );

        expect(flipRow?.classList.contains("step-moved")).toBe(true);
        expect(flipRow?.querySelector(".diff-badge-moved")?.textContent?.trim()).toBe("Moved");
        expect(capRow?.classList.contains("step-moved")).toBe(false);
        expect(pourStirRow?.classList.contains("step-moved")).toBe(false);
        // No content changed anywhere in this scenario.
        expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
        expect(element.shadowRoot?.querySelector(".setup-row-changed")).toBeNull();
      });

      it("renders both Changed and Moved badges when a Method row is both edited and relocated", async () => {
        const changedAndMovedDiffAgainst: IBrewStep[] = [
          ...setupRowsUnchanged(),
          { ...originalTimedSteps[3], seconds: 45 }, // press, changed and moved to front
          originalTimedSteps[0], // pour-stir
          originalTimedSteps[1], // cap
          originalTimedSteps[2], // flip
          originalTimedSteps[4], // bypass
        ];
        element.diffAgainst = changedAndMovedDiffAgainst;
        await element.updateComplete;

        const pressRow = methodRows().find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Press",
        );
        expect(pressRow?.classList.contains("step-changed")).toBe(true);
        expect(pressRow?.classList.contains("step-moved")).toBe(true);
        const badgeTexts = Array.from(pressRow?.querySelectorAll(".diff-badge") ?? []).map(
          (badge) => badge.textContent?.trim(),
        );
        expect(badgeTexts).toEqual(["Changed", "Moved"]);
      });

      it("does not flag a removed or added Method row as moved even though kept rows were reordered in the same diff", async () => {
        const restRow: IBrewStep = { id: "2022-1-rest", label: "Rest", kind: "timed", seconds: 10 };
        const removedAddedReorderDiffAgainst: IBrewStep[] = [
          ...setupRowsUnchanged(),
          originalTimedSteps[4], // bypass, moved to front among the kept rows
          originalTimedSteps[0], // pour-stir
          originalTimedSteps[1], // cap
          // "2022-1-flip" intentionally omitted (removed)
          originalTimedSteps[3], // press
          restRow, // added
        ];
        element.diffAgainst = removedAddedReorderDiffAgainst;
        await element.updateComplete;

        const rows = methodRows();
        const bypassRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Bypass & serve",
        );
        const flipRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Flip",
        );
        const restRowEl = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Rest",
        );

        expect(bypassRow?.classList.contains("step-moved")).toBe(true);
        expect(flipRow?.classList.contains("step-removed")).toBe(true);
        expect(flipRow?.classList.contains("step-moved")).toBe(false);
        expect(restRowEl?.classList.contains("step-added")).toBe(true);
        expect(restRowEl?.classList.contains("step-moved")).toBe(false);
      });

      it("regression guard: no Method row shows a Moved badge when the diff has no reordering (only content changes/add/remove)", async () => {
        element.diffAgainst = diffAgainst;
        await element.updateComplete;

        expect(element.shadowRoot?.querySelector(".step-moved")).toBeNull();
        expect(element.shadowRoot?.querySelector(".diff-badge-moved")).toBeNull();
      });
    });
  });
});
