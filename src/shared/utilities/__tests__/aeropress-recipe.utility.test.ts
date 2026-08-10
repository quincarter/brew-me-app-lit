import { describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../data/aeropress-recipes.data";
import type { IAeropressRecipe } from "../../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../aeropress-recipe.utility";

const recipe = (overrides: Partial<IAeropressRecipe> = {}): IAeropressRecipe => ({
  id: "test-recipe",
  year: 2021,
  place: 4,
  competitor: "Test Competitor",
  country: "Testland",
  setup: { Position: "Inverted", Dose: "18g" },
  steps: ["Pour 100g of water.", "At 30s, stir gently."],
  doseGrams: 18,
  totalWaterGrams: 270,
  ...overrides,
});

describe("aeropress-recipe.utility", () => {
  describe("getAeropressRecipeLabel", () => {
    it("labels 1st place", () => {
      expect(getAeropressRecipeLabel(recipe({ place: 1 }))).toBe(
        "Test Competitor · 2021, 1st place",
      );
    });

    it("labels 2nd place", () => {
      expect(getAeropressRecipeLabel(recipe({ place: 2 }))).toBe(
        "Test Competitor · 2021, 2nd place",
      );
    });

    it("labels 3rd place", () => {
      expect(getAeropressRecipeLabel(recipe({ place: 3 }))).toBe(
        "Test Competitor · 2021, 3rd place",
      );
    });

    it("falls back to Nth place for anything else", () => {
      expect(getAeropressRecipeLabel(recipe({ place: 4 }))).toBe(
        "Test Competitor · 2021, 4th place",
      );
    });
  });

  describe("getAeropressRecipeRatio", () => {
    it("divides totalWaterGrams by doseGrams, rounded to two decimals", () => {
      expect(getAeropressRecipeRatio(recipe({ doseGrams: 18, totalWaterGrams: 270 }))).toBe(15);
    });

    it("rounds a non-terminating division to two decimal places", () => {
      expect(getAeropressRecipeRatio(recipe({ doseGrams: 18, totalWaterGrams: 170 }))).toBe(9.44);
    });
  });

  describe("getAeropressRecipeSteps", () => {
    it("combines curated timedSteps with a note per setup entry when timedSteps is present", () => {
      const curated = AEROPRESS_RECIPES.find((r) => r.id === "2025-1");
      if (!curated) throw new Error("expected 2025-1 fixture recipe");
      if (!curated.timedSteps) throw new Error("expected 2025-1 to have curated timedSteps");

      const steps = getAeropressRecipeSteps(curated);
      const setupEntries = Object.entries(curated.setup);

      expect(steps).toHaveLength(setupEntries.length + curated.timedSteps.length);

      setupEntries.forEach(([key, value], index) => {
        expect(steps[index]).toEqual({
          id: `${curated.id}-setup-${key}`,
          label: key,
          kind: "note",
          value,
        });
      });

      expect(steps.slice(setupEntries.length)).toEqual(curated.timedSteps);
    });

    it("falls back to a flat prose-note dump when timedSteps is absent", () => {
      const uncurated = recipe();

      const steps = getAeropressRecipeSteps(uncurated);
      const setupEntries = Object.entries(uncurated.setup);

      expect(steps).toHaveLength(setupEntries.length + uncurated.steps.length);

      setupEntries.forEach(([key, value], index) => {
        expect(steps[index]).toEqual({
          id: `${uncurated.id}-setup-${key}`,
          label: key,
          kind: "note",
          value,
        });
      });

      uncurated.steps.forEach((step, index) => {
        expect(steps[setupEntries.length + index]).toEqual({
          id: `${uncurated.id}-step-${index}`,
          label: `Step ${index + 1}`,
          kind: "note",
          value: step,
          seconds: null,
        });
      });
    });
  });
});
