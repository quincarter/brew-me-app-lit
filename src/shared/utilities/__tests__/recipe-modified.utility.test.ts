import { describe, expect, it } from "vitest";
import type { IBrewStep, ILoadedRecipeSource } from "../../interfaces/brew.interface";
import { isRecipeModified } from "../recipe-modified.utility";

const steps: IBrewStep[] = [
  { id: "setup-position", label: "Position", kind: "note", value: "Upright" },
  { id: "step-1", label: "Step 1", kind: "note", value: "Pour 100g water.", seconds: null },
];

const source: ILoadedRecipeSource = {
  recipeId: "2025-1",
  label: "Némo Pop · 2025, 1st place",
  ratio: 9.44,
  water: 170,
  coffee: 18,
  steps,
};

describe("recipe-modified.utility", () => {
  it("is not modified when everything matches the source snapshot exactly", () => {
    expect(isRecipeModified({ ratio: "9.44", water: "170", coffee: 18, steps }, source)).toBe(
      false,
    );
  });

  it("is modified when the ratio differs", () => {
    expect(isRecipeModified({ ratio: "16", water: "170", coffee: 18, steps }, source)).toBe(true);
  });

  it("is modified when the water differs", () => {
    expect(isRecipeModified({ ratio: "9.44", water: "200", coffee: 18, steps }, source)).toBe(true);
  });

  it("is modified when the coffee differs", () => {
    expect(isRecipeModified({ ratio: "9.44", water: "170", coffee: 20, steps }, source)).toBe(true);
  });

  it("is modified when the step count differs", () => {
    expect(
      isRecipeModified({ ratio: "9.44", water: "170", coffee: 18, steps: [steps[0]] }, source),
    ).toBe(true);
  });

  it("is modified when a step's value changes", () => {
    const editedSteps: IBrewStep[] = [{ ...steps[0], value: "Inverted" }, steps[1]];
    expect(
      isRecipeModified({ ratio: "9.44", water: "170", coffee: 18, steps: editedSteps }, source),
    ).toBe(true);
  });

  it("is not modified when a step's optional fields are simply unset vs. empty-string equivalents", () => {
    const equivalentSteps: IBrewStep[] = [
      { id: "setup-position", label: "Position", kind: "note", value: "Upright", note: undefined },
      { id: "step-1", label: "Step 1", kind: "note", value: "Pour 100g water." },
    ];
    expect(
      isRecipeModified({ ratio: "9.44", water: "170", coffee: 18, steps: equivalentSteps }, source),
    ).toBe(false);
  });
});
