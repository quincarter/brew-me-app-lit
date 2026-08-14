import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { V60_RECIPES } from "../../../shared/data/v60-recipes.data";
import type { IBrewStep, IV60Recipe } from "../../../shared/interfaces/brew.interface";
import { getPouroverRecipeSteps } from "../../../shared/utilities/pourover-recipe.utility";
import "../brew-pourover-recipe-card";
import type { PourOverRecipeCard } from "../PourOverRecipeCard";

const recipe: IV60Recipe = {
  id: "test-v60-recipe",
  title: "Test V60 Recipe",
  author: "Test Author",
  setup: { Dripper: "V60 02", Dose: "15g" },
  steps: ["Bloom 45s.", "Pour to 250g."],
};

describe("brew-pourover-recipe-card", () => {
  let element: PourOverRecipeCard;

  beforeEach(async () => {
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
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
    element.remove();
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
    element.startOpen = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
  });

  it("omits the brew button when hide-brew-button is set", async () => {
    element.remove();
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
    element.startOpen = true;
    element.hideBrewButton = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    const brewButton = element.shadowRoot?.querySelector("brew-button");
    expect(brewButton).toBeNull();
  });

  describe("diffAgainst", () => {
    // A real curated V60 recipe (Scott Rao's "Spin to Win") with a realistic
    // Setup table (4 keys) and hand-curated `timedSteps` (4 method phases).
    const diffRecipe = V60_RECIPES.find((candidate) => candidate.id === "rao") as IV60Recipe;

    if (!diffRecipe) throw new Error("expected V60_RECIPES to contain 'rao'");

    const originalTimedSteps = diffRecipe.timedSteps as IBrewStep[];

    // A single diffAgainst fixture exercising every diff state at once:
    // - Setup: "Water" changed (360g -> 350g), "Brew time" removed,
    //   "Dose"/"Ratio" unchanged.
    // - Method: "rao-pour" removed, "rao-swirl" changed (75s -> 90s
    //   duration), a new "rao-cool" step added, "rao-bloom"/"rao-serve"
    //   unchanged.
    const diffAgainst: IBrewStep[] = [
      { id: "rao-setup-Dose", label: "Dose", kind: "note", value: "22g" },
      { id: "rao-setup-Water", label: "Water", kind: "note", value: "350g" },
      { id: "rao-setup-Ratio", label: "Ratio", kind: "note", value: "1:16.4" },
      // "rao-setup-Brew time" intentionally omitted (removed).
      originalTimedSteps[0], // rao-bloom, unchanged
      // "rao-pour" intentionally omitted (removed).
      { ...originalTimedSteps[2], seconds: 90 }, // rao-swirl, changed
      originalTimedSteps[3], // rao-serve, unchanged (seconds: null -> "Now")
      { id: "rao-cool", label: "Cool & serve", kind: "timed", seconds: 20 }, // added
    ];

    const setupRow = (key: string): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll(".setup-row") ?? []).find(
        (row) => row.querySelector("dt")?.textContent?.trim() === key,
      );

    const methodRows = (): HTMLLIElement[] =>
      Array.from(element.shadowRoot?.querySelectorAll(".steps > li") ?? []);

    beforeEach(async () => {
      element.remove();
      element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
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

    it("with diffAgainst set but identical to the recipe's own canonical steps, falls back to the exact same raw-prose Method list as no diff at all", async () => {
      // An unmodified brew still sets diffAgainst (it's just equal to the
      // recipe's own canonical steps - setup rows AND timed steps, not just
      // the timed-step portion) - there's nothing to actually show a diff
      // *of*, so this must render identically to diffAgainst being unset
      // entirely, not the curated timedSteps list. Otherwise an unmodified
      // recipe would look like a different, shorter recipe in Diff mode
      // purely because of the raw-prose-vs-curated format split, which
      // reads as data loss even though nothing changed.
      element.diffAgainst = getPouroverRecipeSteps(diffRecipe).map((step) => ({ ...step }));
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".setup-row-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".setup-row-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-added")).toBeNull();
      expect(element.shadowRoot?.querySelector(".step-removed")).toBeNull();
      expect(element.shadowRoot?.querySelector(".diff-badge")).toBeNull();
      expect(methodRows()).toHaveLength(diffRecipe.steps.length);
      expect(methodRows().map((row) => row.textContent?.trim())).toEqual(diffRecipe.steps);
    });

    it("a changed setup value renders old -> new with a Changed badge; other setup rows are unaffected", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const waterRow = setupRow("Water");
      expect(waterRow).not.toBeUndefined();
      expect(waterRow?.classList.contains("setup-row-changed")).toBe(true);
      expect(waterRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("360g");
      expect(waterRow?.querySelector(".diff-new")?.textContent?.trim()).toBe("350g");
      expect(waterRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Changed");

      const doseRow = setupRow("Dose");
      expect(doseRow?.classList.contains("setup-row-changed")).toBe(false);
      expect(doseRow?.classList.contains("setup-row-removed")).toBe(false);
      expect(doseRow?.querySelector(".diff-badge")).toBeNull();
    });

    it("a removed setup id renders struck-through with a Removed badge, showing the original value", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const brewTimeRow = setupRow("Brew time");
      expect(brewTimeRow).not.toBeUndefined();
      expect(brewTimeRow?.classList.contains("setup-row-removed")).toBe(true);
      expect(brewTimeRow?.querySelector(".diff-old")?.textContent?.trim()).toBe("3:00");
      expect(brewTimeRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Removed");
    });

    it("a changed method step shows its current diffAgainst duration (via formatSeconds) with a Changed badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const swirlRow = methodRows().find(
        (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Swirl & drawdown",
      );
      expect(swirlRow).not.toBeUndefined();
      expect(swirlRow?.classList.contains("step-changed")).toBe(true);
      expect(swirlRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("01:30");
      expect(swirlRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Changed");
    });

    it("a removed method step shows struck-through original canonical values, in its original position among the other rows", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      const labels = rows.map((row) => row.querySelector(".step-line-label")?.textContent?.trim());
      // Canonical order is bloom, pour, swirl, serve, then any added rows
      // appended - "pour" (removed) stays in its own slot rather than being
      // dropped or moved to the end.
      expect(labels).toEqual([
        "Bloom & stir",
        "Main pour",
        "Swirl & drawdown",
        "Serve",
        "Cool & serve",
      ]);

      const pourRow = rows.find(
        (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Main pour",
      );
      expect(pourRow?.classList.contains("step-removed")).toBe(true);
      expect(pourRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("01:00");
      expect(pourRow?.querySelector(".diff-badge")?.textContent?.trim()).toBe("Removed");
    });

    it("an added method step (present in diffAgainst, absent from the canonical list) is appended at the end with an Added badge", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      const lastRow = rows[rows.length - 1];
      expect(lastRow.querySelector(".step-line-label")?.textContent?.trim()).toBe("Cool & serve");
      expect(lastRow.classList.contains("step-added")).toBe(true);
      expect(lastRow.querySelector(".step-line-value")?.textContent?.trim()).toBe("00:20");
      expect(lastRow.querySelector(".diff-badge")?.textContent?.trim()).toBe("Added");
    });

    it("an untimed ('now') kept step renders 'Now' rather than a duration", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const serveRow = methodRows().find(
        (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Serve",
      );
      expect(serveRow?.classList.contains("step-changed")).toBe(false);
      expect(serveRow?.querySelector(".step-line-value")?.textContent?.trim()).toBe("Now");
    });

    it("bug-fix regression guard: the Method section never contains a row for a setup key", async () => {
      element.diffAgainst = diffAgainst;
      await element.updateComplete;

      const rows = methodRows();
      // 4 canonical brew-only steps (bloom, pour, swirl, serve) + 1 added
      // ("cool") = 5 - never 4 (brew) + 4 (setup) = 8.
      expect(rows).toHaveLength(5);

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
          originalTimedSteps[0], // rao-bloom
          originalTimedSteps[2], // rao-swirl, moved ahead of rao-pour
          originalTimedSteps[1], // rao-pour
          originalTimedSteps[3], // rao-serve
        ];
        element.diffAgainst = reorderOnlyDiffAgainst;
        await element.updateComplete;

        const rows = methodRows();
        const swirlRow = rows.find(
          (row) =>
            row.querySelector(".step-line-label")?.textContent?.trim() === "Swirl & drawdown",
        );
        const pourRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Main pour",
        );
        const bloomRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Bloom & stir",
        );

        expect(swirlRow?.classList.contains("step-moved")).toBe(true);
        expect(swirlRow?.querySelector(".diff-badge-moved")?.textContent?.trim()).toBe("Moved");
        expect(pourRow?.classList.contains("step-moved")).toBe(false);
        expect(bloomRow?.classList.contains("step-moved")).toBe(false);
        // No content changed anywhere in this scenario.
        expect(element.shadowRoot?.querySelector(".step-changed")).toBeNull();
        expect(element.shadowRoot?.querySelector(".setup-row-changed")).toBeNull();
      });

      it("renders both Changed and Moved badges when a Method row is both edited and relocated", async () => {
        const changedAndMovedDiffAgainst: IBrewStep[] = [
          ...setupRowsUnchanged(),
          { ...originalTimedSteps[2], seconds: 90 }, // rao-swirl, changed and moved to front
          originalTimedSteps[0], // rao-bloom
          originalTimedSteps[1], // rao-pour
          originalTimedSteps[3], // rao-serve
        ];
        element.diffAgainst = changedAndMovedDiffAgainst;
        await element.updateComplete;

        const swirlRow = methodRows().find(
          (row) =>
            row.querySelector(".step-line-label")?.textContent?.trim() === "Swirl & drawdown",
        );
        expect(swirlRow?.classList.contains("step-changed")).toBe(true);
        expect(swirlRow?.classList.contains("step-moved")).toBe(true);
        const badgeTexts = Array.from(swirlRow?.querySelectorAll(".diff-badge") ?? []).map(
          (badge) => badge.textContent?.trim(),
        );
        expect(badgeTexts).toEqual(["Changed", "Moved"]);
      });

      it("does not flag a removed or added Method row as moved even though kept rows were reordered in the same diff", async () => {
        const coolRow: IBrewStep = {
          id: "rao-cool",
          label: "Cool & serve",
          kind: "timed",
          seconds: 20,
        };
        const removedAddedReorderDiffAgainst: IBrewStep[] = [
          ...setupRowsUnchanged(),
          originalTimedSteps[3], // rao-serve, moved to front among the kept rows
          originalTimedSteps[0], // rao-bloom
          // "rao-pour" intentionally omitted (removed)
          originalTimedSteps[2], // rao-swirl
          coolRow, // added
        ];
        element.diffAgainst = removedAddedReorderDiffAgainst;
        await element.updateComplete;

        const rows = methodRows();
        const serveRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Serve",
        );
        const pourRow = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Main pour",
        );
        const coolRowEl = rows.find(
          (row) => row.querySelector(".step-line-label")?.textContent?.trim() === "Cool & serve",
        );

        expect(serveRow?.classList.contains("step-moved")).toBe(true);
        expect(pourRow?.classList.contains("step-removed")).toBe(true);
        expect(pourRow?.classList.contains("step-moved")).toBe(false);
        expect(coolRowEl?.classList.contains("step-added")).toBe(true);
        expect(coolRowEl?.classList.contains("step-moved")).toBe(false);
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
