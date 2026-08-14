import { describe, expect, it } from "vitest";
import type { IBrewStep } from "../../interfaces/brew.interface";
import {
  applyBrewStepsDiff,
  computeBrewStepsDiff,
  findMovedStepIds,
} from "../brew-steps-diff.utility";
import { stepsEqual } from "../recipe-modified.utility";
import { buildRecipeSource } from "../recipe-registry.utility";

const original: IBrewStep[] = [
  { id: "a", label: "Bloom", kind: "timed", seconds: 30, note: "Wet grounds" },
  { id: "b", label: "Pour", kind: "timed", seconds: 45 },
  { id: "c", label: "Filter", kind: "note", value: "Paper" },
];

describe("brew-steps-diff.utility", () => {
  describe("computeBrewStepsDiff", () => {
    it("returns an empty diff object when nothing changed", () => {
      const modified = original.map((step) => ({ ...step }));

      expect(computeBrewStepsDiff(original, modified)).toEqual({});
    });

    it("captures only the id and the single field that changed on one row", () => {
      const modified = original.map((step) => (step.id === "a" ? { ...step, seconds: 40 } : step));

      expect(computeBrewStepsDiff(original, modified)).toEqual({
        changed: [{ id: "a", seconds: 40 }],
      });
    });

    it("captures every field that changed on one row, and nothing else", () => {
      const modified = original.map((step) =>
        step.id === "b" ? { ...step, label: "Pour water", seconds: 50, note: "Steady pour" } : step,
      );

      expect(computeBrewStepsDiff(original, modified)).toEqual({
        changed: [{ id: "b", label: "Pour water", seconds: 50, note: "Steady pour" }],
      });
    });

    it("puts a row present in modified but not original into `added`, not `changed`", () => {
      const newRow: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      const modified = [...original, newRow];

      expect(computeBrewStepsDiff(original, modified)).toEqual({ added: [newRow] });
    });

    it("puts a row present in original but not modified into `removed`, as just the id", () => {
      const modified = original.filter((step) => step.id !== "b");

      expect(computeBrewStepsDiff(original, modified)).toEqual({ removed: ["b"] });
    });

    it("captures a pure reorder as the full modified id sequence in `order`, with changed/added/removed absent", () => {
      const modified = [original[1], original[0], original[2]];

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff).toEqual({ order: ["b", "a", "c"] });
      expect(diff.changed).toBeUndefined();
      expect(diff.added).toBeUndefined();
      expect(diff.removed).toBeUndefined();
    });

    it("omits `order` when removing/adding rows doesn't disturb the remaining rows' relative order", () => {
      const newRow: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      // Remove "b", keep "a" and "c" in their original relative order, append "d" - exactly
      // the default "original minus removed, plus added at the end" shape.
      const modified = [original[0], original[2], newRow];

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff.order).toBeUndefined();
      expect(diff).toEqual({ removed: ["b"], added: [newRow] });
    });

    it("captures a kind toggle from timed to note, clearing the no-longer-relevant seconds field", () => {
      const modified = original.map((step) =>
        step.id === "a"
          ? { ...step, kind: "note" as const, seconds: undefined, value: "Some value" }
          : step,
      );

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff.changed).toEqual([{ id: "a", kind: "note", seconds: null, value: "Some value" }]);

      const applied = applyBrewStepsDiff(original, diff);
      expect(stepsEqual(applied, modified)).toBe(true);
      const appliedRow = applied.find((step) => step.id === "a");
      // The old timed duration must not survive the toggle.
      expect(appliedRow?.seconds).not.toBe(30);
      expect(appliedRow?.seconds ?? null).toBeNull();
    });

    it("captures a note field cleared back to unset, translating back to undefined on apply", () => {
      const modified = original.map((step) =>
        step.id === "a" ? { ...step, note: undefined } : step,
      );

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff.changed).toEqual([{ id: "a", note: null }]);

      const applied = applyBrewStepsDiff(original, diff);
      expect(stepsEqual(applied, modified)).toBe(true);
      const appliedRow = applied.find((step) => step.id === "a");
      expect(appliedRow?.note).not.toBe("Wet grounds");
      expect(appliedRow?.note).toBeUndefined();
    });

    it("captures a kind toggle from note to timed, clearing the no-longer-relevant value field", () => {
      const modified = original.map((step) =>
        step.id === "c" ? { ...step, kind: "timed" as const, seconds: 20, value: undefined } : step,
      );

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff.changed).toEqual([{ id: "c", kind: "timed", seconds: 20, value: null }]);

      const applied = applyBrewStepsDiff(original, diff);
      expect(stepsEqual(applied, modified)).toBe(true);
      const appliedRow = applied.find((step) => step.id === "c");
      // The old note value must not survive the toggle.
      expect(appliedRow?.value).not.toBe("Paper");
      expect(appliedRow?.value).toBeUndefined();
    });
  });

  describe("applyBrewStepsDiff", () => {
    it("returns the original array unchanged (content-wise) when the diff is empty", () => {
      expect(applyBrewStepsDiff(original, {})).toEqual(original);
    });

    it("round-trips a single-field change", () => {
      const modified = original.map((step) => (step.id === "a" ? { ...step, seconds: 40 } : step));
      const diff = computeBrewStepsDiff(original, modified);

      expect(stepsEqual(applyBrewStepsDiff(original, diff), modified)).toBe(true);
    });

    it("round-trips an added row", () => {
      const newRow: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      const modified = [...original, newRow];
      const diff = computeBrewStepsDiff(original, modified);

      expect(stepsEqual(applyBrewStepsDiff(original, diff), modified)).toBe(true);
    });

    it("round-trips a removed row", () => {
      const modified = original.filter((step) => step.id !== "b");
      const diff = computeBrewStepsDiff(original, modified);

      expect(stepsEqual(applyBrewStepsDiff(original, diff), modified)).toBe(true);
    });

    it("round-trips a pure reorder, preserving the exact modified sequence", () => {
      const modified = [original[1], original[0], original[2]];
      const diff = computeBrewStepsDiff(original, modified);

      const applied = applyBrewStepsDiff(original, diff);
      expect(applied.map((step) => step.id)).toEqual(["b", "a", "c"]);
      expect(stepsEqual(applied, modified)).toBe(true);
    });

    it("round-trips a combined change/add/remove/reorder in one diff", () => {
      const bChanged: IBrewStep = { ...original[1], label: "Pour more" };
      const d: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      // Drop "a", change "b", keep "c", add "d", and reorder to [d, c, bChanged].
      const modified = [d, original[2], bChanged];

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff).toEqual({
        changed: [{ id: "b", label: "Pour more" }],
        added: [d],
        removed: ["a"],
        order: ["d", "c", "b"],
      });

      const applied = applyBrewStepsDiff(original, diff);
      expect(applied.map((step) => step.id)).toEqual(["d", "c", "b"]);
      expect(stepsEqual(applied, modified)).toBe(true);
    });
  });

  describe("round-trip through JSON (the real /share query-param path)", () => {
    it("survives a JSON.stringify/JSON.parse cycle for a single-field change", () => {
      const modified = original.map((step) => (step.id === "a" ? { ...step, seconds: 40 } : step));
      const diff = computeBrewStepsDiff(original, modified);

      const roundTripped = JSON.parse(JSON.stringify(diff));
      expect(stepsEqual(applyBrewStepsDiff(original, roundTripped), modified)).toBe(true);
    });

    it("survives a JSON.stringify/JSON.parse cycle for a combined change/add/remove/reorder diff", () => {
      const bChanged: IBrewStep = { ...original[1], label: "Pour more" };
      const d: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      const modified = [d, original[2], bChanged];
      const diff = computeBrewStepsDiff(original, modified);

      const roundTripped = JSON.parse(JSON.stringify(diff));
      const applied = applyBrewStepsDiff(original, roundTripped);
      expect(applied.map((step) => step.id)).toEqual(["d", "c", "b"]);
      expect(stepsEqual(applied, modified)).toBe(true);
    });

    it("survives a JSON.stringify/JSON.parse cycle for a kind-toggle field-clearing diff", () => {
      const modified = original.map((step) =>
        step.id === "a"
          ? { ...step, kind: "note" as const, seconds: undefined, value: "Some value" }
          : step,
      );
      const diff = computeBrewStepsDiff(original, modified);

      const roundTripped = JSON.parse(JSON.stringify(diff));
      const applied = applyBrewStepsDiff(original, roundTripped);
      expect(stepsEqual(applied, modified)).toBe(true);
      expect(applied.find((step) => step.id === "a")?.seconds ?? null).toBeNull();
    });

    it("round-trips a realistic multi-field, multi-row WAC recipe edit through JSON", () => {
      const recipeSource = buildRecipeSource("2022-1");
      if (!recipeSource) {
        throw new Error(
          "Fixture recipe id '2022-1' is no longer registered - update the test fixture.",
        );
      }
      const recipeSteps = recipeSource.steps;
      expect(recipeSteps.length).toBeGreaterThan(5);

      const newRow: IBrewStep = {
        id: "extra-rest",
        label: "Rest",
        kind: "timed",
        seconds: 15,
      };
      const modified = [
        // Drop the first setup row entirely.
        ...recipeSteps.slice(1).map((step, index) => {
          if (index === 0) return { ...step, value: "Standard" }; // change a note row's value
          if (step.kind === "timed" && typeof step.seconds === "number") {
            return index === 1
              ? { ...step, seconds: step.seconds + 5, note: "Adjusted timing" }
              : step;
          }
          return step;
        }),
        newRow,
      ];

      const diff = computeBrewStepsDiff(recipeSteps, modified);
      const roundTripped = JSON.parse(JSON.stringify(diff));
      const applied = applyBrewStepsDiff(recipeSteps, roundTripped);

      expect(stepsEqual(applied, modified)).toBe(true);
      expect(applied.map((step) => step.id)).toEqual(modified.map((step) => step.id));
    });
  });

  describe("findMovedStepIds", () => {
    it("returns an empty set when the array is compared against itself", () => {
      expect(findMovedStepIds(original, original)).toEqual(new Set());
    });

    it("returns an empty set for a same-order copy with no position changes", () => {
      const modified = original.map((step) => ({ ...step }));

      expect(findMovedStepIds(original, modified)).toEqual(new Set());
    });

    it("returns an empty set for empty arrays, without erroring", () => {
      expect(findMovedStepIds([], [])).toEqual(new Set());
    });

    it("flags exactly 2 of 3 ids for a full reversal, per the LCS's deterministic tie-breaking", () => {
      // LCS of ["a","b","c"] vs ["c","b","a"] has length 1, and the
      // implementation's backtrack (favoring `i--` on a length tie) anchors
      // on "a" as the single kept id, leaving "b" and "c" flagged - a
      // different, equally-valid LCS choice (e.g. anchoring on "b" or "c")
      // would flag a different pair, so this asserts the actual
      // deterministic output rather than an arbitrary "expected" one.
      const modified = [original[2], original[1], original[0]];

      expect(findMovedStepIds(original, modified)).toEqual(new Set(["b", "c"]));
    });

    it("flags only the single relocated id when one item moves from the front to the back of a 4-item array", () => {
      const d: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      const fourItems = [...original, d];
      // [a,b,c,d] -> [b,c,d,a]: b/c/d's absolute index shifts too, but only
      // "a" actually left its relative position among the others - the
      // "minimal set" property `findMovedStepIds` exists for.
      const modified = [fourItems[1], fourItems[2], fourItems[3], fourItems[0]];

      expect(findMovedStepIds(fourItems, modified)).toEqual(new Set(["a"]));
    });

    it("flags exactly 1 of the 2 ids in an adjacent two-item swap", () => {
      const modified = [original[1], original[0], original[2]];

      expect(findMovedStepIds(original, modified)).toEqual(new Set(["b"]));
    });

    it("excludes added/removed ids and flags only the relocated kept row(s) in a combined reorder + add + remove diff", () => {
      const d: IBrewStep = { id: "d", label: "Rest", kind: "note", value: "Optional" };
      const e: IBrewStep = { id: "e", label: "Extra", kind: "note", value: "New" };
      const fourItems = [...original, d];
      // Drop "b", keep "a"/"c"/"d" but swap "a" and "c", and add "e" - "e"
      // (added) and "b" (removed) must never appear in the result.
      const modified = [fourItems[2], fourItems[0], e, fourItems[3]];

      expect(findMovedStepIds(fourItems, modified)).toEqual(new Set(["c"]));
    });

    it("matches rows purely by id, so a content-only change with no position change is not flagged as moved", () => {
      const modified = original.map((step) => (step.id === "b" ? { ...step, seconds: 999 } : step));

      expect(findMovedStepIds(original, modified)).toEqual(new Set());
    });

    it("flags a row as moved by id position alone, independently of whether its content also changed", () => {
      // "a" is both content-changed (per computeBrewStepsDiff) and
      // reordered - the two signals are independent, and this function
      // only cares about the latter.
      const changedA: IBrewStep = { ...original[0], seconds: 999 };
      const modified = [original[1], changedA, original[2]];

      const diff = computeBrewStepsDiff(original, modified);
      expect(diff.changed).toEqual([{ id: "a", seconds: 999 }]);
      expect(findMovedStepIds(original, modified)).toEqual(new Set(["b"]));
    });
  });
});
