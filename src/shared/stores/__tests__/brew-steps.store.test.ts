import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../data/aeropress-recipes.data";
import { BREW_STEPS_PRESETS } from "../../data/brew-steps-presets.data";
import { gramsToOunces, round2 } from "../../utilities/ratio.utility";
import {
  QUICK_CALCULATOR,
  brewStepsSignal,
  clearBrewStepsState,
  loadAeropressRecipeIntoCalculator,
  loadedRecipeSourceSignal,
  reopenBrewTypeChooser,
  resetBrewStepsToPreset,
  selectBrewType,
  selectedBrewTypeSignal,
  updateBrewStepsConfig,
} from "../brew-steps.store";
import { coffeeSignal, ozSignal, ratioSignal, waterSignal } from "../calculator.store";

describe("brew-steps.store", () => {
  beforeEach(() => {
    clearBrewStepsState();
    ratioSignal.value = "16";
    waterSignal.value = "";
    ozSignal.value = "";
    coffeeSignal.value = null;
  });

  describe("selectBrewType", () => {
    it("seeds brewStepsSignal from BREW_STEPS_PRESETS for a type with a preset", () => {
      selectBrewType("Aeropress");

      expect(selectedBrewTypeSignal.value).toBe("Aeropress");
      expect(brewStepsSignal.value).toEqual(BREW_STEPS_PRESETS.Aeropress);
    });

    it("leaves brewStepsSignal null for a type with no preset", () => {
      selectBrewType("Cold Brew");

      expect(selectedBrewTypeSignal.value).toBe("Cold Brew");
      expect(brewStepsSignal.value).toBeNull();
    });

    it("sets selectedBrewTypeSignal to the quick-calculator sentinel and leaves steps null", () => {
      selectBrewType(QUICK_CALCULATOR);

      expect(selectedBrewTypeSignal.value).toBe(QUICK_CALCULATOR);
      expect(brewStepsSignal.value).toBeNull();
    });

    it("clears any prior recipe-load provenance", () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(AEROPRESS_RECIPES[0]);
      expect(loadedRecipeSourceSignal.value).not.toBeNull();

      selectBrewType("V60");

      expect(loadedRecipeSourceSignal.value).toBeNull();
    });
  });

  describe("reopenBrewTypeChooser", () => {
    it("resets only selectedBrewTypeSignal back to null", () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(AEROPRESS_RECIPES[0]);

      reopenBrewTypeChooser();

      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(brewStepsSignal.value).not.toBeNull();
      expect(loadedRecipeSourceSignal.value).not.toBeNull();
    });
  });

  describe("updateBrewStepsConfig", () => {
    it("wholesale replaces brewStepsSignal", () => {
      selectBrewType("Aeropress");
      const replacement = {
        steps: [{ id: "custom-1", label: "Custom", kind: "note" as const, value: "x" }],
      };

      updateBrewStepsConfig(replacement);

      expect(brewStepsSignal.value).toEqual(replacement);
    });
  });

  describe("resetBrewStepsToPreset", () => {
    it("discards hand edits and restores the current type's canned preset", () => {
      selectBrewType("Aeropress");
      updateBrewStepsConfig({ steps: [] });

      resetBrewStepsToPreset();

      expect(brewStepsSignal.value).toEqual(BREW_STEPS_PRESETS.Aeropress);
    });

    it("clears the card entirely for a type with no preset", () => {
      selectBrewType("Cold Brew");
      updateBrewStepsConfig({ steps: [{ id: "x", label: "X", kind: "note", value: "y" }] });

      resetBrewStepsToPreset();

      expect(brewStepsSignal.value).toBeNull();
    });

    it("clears the card when no type is selected", () => {
      selectBrewType("Aeropress");
      reopenBrewTypeChooser();

      resetBrewStepsToPreset();

      expect(brewStepsSignal.value).toBeNull();
    });
  });

  describe("loadAeropressRecipeIntoCalculator", () => {
    const recipe = AEROPRESS_RECIPES.find((item) => item.id === "2025-1");
    if (!recipe) throw new Error("expected the 2025-1 WAC recipe to exist in test data");

    it("derives ratio/water/coffee from doseGrams/totalWaterGrams and fills the calculator", () => {
      loadAeropressRecipeIntoCalculator(recipe);

      const expectedRatio = round2(recipe.totalWaterGrams / recipe.doseGrams);
      expect(ratioSignal.value).toBe(String(expectedRatio));
      expect(waterSignal.value).toBe(String(recipe.totalWaterGrams));
      expect(ozSignal.value).toBe(String(gramsToOunces(recipe.totalWaterGrams)));
      expect(coffeeSignal.value).toBe(recipe.doseGrams);
    });

    it("builds note rows from setup then prose steps, and populates loadedRecipeSourceSignal", () => {
      loadAeropressRecipeIntoCalculator(recipe);

      const setupKeys = Object.keys(recipe.setup);
      const steps = brewStepsSignal.value?.steps ?? [];
      expect(steps).toHaveLength(setupKeys.length + recipe.steps.length);

      setupKeys.forEach((key, index) => {
        const step = steps[index];
        expect(step?.label).toBe(key);
        expect(step?.kind).toBe("note");
        expect(step?.value).toBe(recipe.setup[key]);
      });

      recipe.steps.forEach((prose, index) => {
        const step = steps[setupKeys.length + index];
        expect(step?.label).toBe(`Step ${index + 1}`);
        expect(step?.kind).toBe("note");
        expect(step?.value).toBe(prose);
        expect(step?.seconds).toBeNull();
      });

      const source = loadedRecipeSourceSignal.value;
      expect(source).not.toBeNull();
      expect(source?.recipeId).toBe(recipe.id);
      expect(source?.label).toBe(`${recipe.competitor} · ${recipe.year}, 1st place`);
      expect(source?.ratio).toBe(round2(recipe.totalWaterGrams / recipe.doseGrams));
      expect(source?.water).toBe(recipe.totalWaterGrams);
      expect(source?.coffee).toBe(recipe.doseGrams);
      expect(source?.steps).toEqual(steps);
    });

    it("formats 2nd/3rd/other places distinctly from 1st", () => {
      const second = AEROPRESS_RECIPES.find((item) => item.place === 2);
      if (!second) throw new Error("expected a 2nd-place recipe in test data");

      loadAeropressRecipeIntoCalculator(second);

      expect(loadedRecipeSourceSignal.value?.label).toContain("2nd place");
    });
  });

  describe("clearBrewStepsState", () => {
    it("resets selectedBrewTypeSignal, brewStepsSignal, and loadedRecipeSourceSignal to their defaults", () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(AEROPRESS_RECIPES[0]);

      clearBrewStepsState();

      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(brewStepsSignal.value).toBeNull();
      expect(loadedRecipeSourceSignal.value).toBeNull();
    });
  });
});
