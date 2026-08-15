import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../data/aeropress-recipes.data";
import { BREW_STEPS_PRESETS } from "../../data/brew-steps-presets.data";
import { ESPRESSO_PROFILES } from "../../data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../data/espresso-shot-styles.data";
import type { IAeropressRecipe } from "../../interfaces/brew.interface";
import {
  ESPRESSO_STYLE_DEFAULT_GRIND,
  ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
  ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
  buildEspressoSteps,
} from "../../utilities/espresso-recipe.utility";
import { gramsToOunces, round2 } from "../../utilities/ratio.utility";
import {
  QUICK_CALCULATOR,
  brewStepsSignal,
  clearBrewStepsState,
  loadAeropressRecipeIntoCalculator,
  loadEspressoProfileIntoCalculator,
  loadEspressoShotStyleIntoCalculator,
  loadedRecipeSourceSignal,
  reopenBrewTypeChooser,
  resetBrewStepsToPreset,
  selectBrewType,
  selectedBrewTypeSignal,
  updateBrewStepsConfig,
} from "../brew-steps.store";
import { coffeeSignal, ozSignal, ratioSignal, waterSignal } from "../calculator.store";
import {
  espressoDoseInSignal,
  espressoDoseOutSignal,
  espressoRatioSignal,
  resetEspressoCalculator,
  setEspressoDoseIn,
} from "../espresso-calculator.store";

describe("brew-steps.store", () => {
  beforeEach(() => {
    clearBrewStepsState();
    ratioSignal.value = "16";
    waterSignal.value = "";
    ozSignal.value = "";
    coffeeSignal.value = null;
    resetEspressoCalculator();
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

    it("seeds the espresso store's 18/2/36 defaults when picking Espresso Shot", () => {
      setEspressoDoseIn("20");

      selectBrewType("Espresso Shot");

      expect(selectedBrewTypeSignal.value).toBe("Espresso Shot");
      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(36);
    });

    it("does not touch the espresso store when picking a non-espresso type", () => {
      setEspressoDoseIn("20");

      selectBrewType("V60");

      expect(espressoDoseInSignal.value).toBe(20);
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

    it("builds note rows from setup, then the recipe's curated timed steps, and populates loadedRecipeSourceSignal", () => {
      if (!recipe.timedSteps) throw new Error("expected the 2025-1 fixture to have timedSteps");
      loadAeropressRecipeIntoCalculator(recipe);

      const setupKeys = Object.keys(recipe.setup);
      const steps = brewStepsSignal.value?.steps ?? [];
      expect(steps).toHaveLength(setupKeys.length + recipe.timedSteps.length);

      setupKeys.forEach((key, index) => {
        const step = steps[index];
        expect(step?.label).toBe(key);
        expect(step?.kind).toBe("note");
        expect(step?.value).toBe(recipe.setup[key]);
      });

      expect(steps.slice(setupKeys.length)).toEqual(recipe.timedSteps);
      // At least one curated step is a real timed phase, not just a flat prose dump.
      expect(recipe.timedSteps.some((step) => step.kind === "timed" && step.seconds)).toBe(true);

      const source = loadedRecipeSourceSignal.value;
      expect(source).not.toBeNull();
      expect(source?.recipeId).toBe(recipe.id);
      expect(source?.label).toBe(`${recipe.competitor} · ${recipe.year}, 1st place`);
      expect(source?.ratio).toBe(round2(recipe.totalWaterGrams / recipe.doseGrams));
      expect(source?.water).toBe(recipe.totalWaterGrams);
      expect(source?.coffee).toBe(recipe.doseGrams);
      expect(source?.steps).toEqual(steps);
    });

    it("falls back to a flat prose-note dump for a recipe with no curated timedSteps", () => {
      const uncuratedRecipe: IAeropressRecipe = {
        id: "uncurated-1",
        year: 2099,
        place: 1,
        competitor: "Test Competitor",
        country: "Testland",
        setup: { Dose: "20g" },
        steps: ["Pour water.", "Press."],
        doseGrams: 20,
        totalWaterGrams: 300,
      };

      loadAeropressRecipeIntoCalculator(uncuratedRecipe);

      const steps = brewStepsSignal.value?.steps ?? [];
      expect(steps).toHaveLength(1 + uncuratedRecipe.steps.length);
      expect(steps[1]).toEqual({
        id: "uncurated-1-step-0",
        label: "Step 1",
        kind: "note",
        value: "Pour water.",
        seconds: null,
      });
      expect(steps[2]).toEqual({
        id: "uncurated-1-step-1",
        label: "Step 2",
        kind: "note",
        value: "Press.",
        seconds: null,
      });
    });

    it("formats 2nd/3rd/other places distinctly from 1st", () => {
      const second = AEROPRESS_RECIPES.find((item) => item.place === 2);
      if (!second) throw new Error("expected a 2nd-place recipe in test data");

      loadAeropressRecipeIntoCalculator(second);

      expect(loadedRecipeSourceSignal.value?.label).toContain("2nd place");
    });
  });

  describe("buildEspressoSteps", () => {
    it("builds the four-row grind/temp/preinfusion/shot-time sequence", () => {
      const steps = buildEspressoSteps(10, 30, "Fine", "200°F");

      expect(steps).toEqual([
        { id: "espresso-grind", label: "Grind", kind: "note", value: "Fine" },
        { id: "espresso-temp", label: "Water temp", kind: "note", value: "200°F" },
        { id: "espresso-preinfusion", label: "Preinfusion", kind: "timed", seconds: 10 },
        { id: "espresso-shot", label: "Shot time", kind: "timed", seconds: 30 },
      ]);
    });
  });

  describe("loadEspressoShotStyleIntoCalculator", () => {
    const style = ESPRESSO_SHOT_STYLES.find((item) => item.id === "double");
    if (!style) throw new Error("expected the 'double' shot style to exist in test data");

    it("populates the espresso dose-in/ratio/dose-out signals from the style", () => {
      loadEspressoShotStyleIntoCalculator(style);

      expect(selectedBrewTypeSignal.value).toBe("Espresso Shot");
      expect(espressoDoseInSignal.value).toBe(style.doseIn);
      expect(espressoRatioSignal.value).toBe(style.ratio);
      expect(espressoDoseOutSignal.value).toBe(style.doseOut);
    });

    it("builds brewStepsSignal using the style-wide preinfusion/grind/water-temp defaults, since a plain style carries none of its own", () => {
      loadEspressoShotStyleIntoCalculator(style);

      expect(brewStepsSignal.value).toEqual({
        steps: buildEspressoSteps(
          ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
          style.shotTimeSec,
          ESPRESSO_STYLE_DEFAULT_GRIND,
          ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
        ),
      });
    });

    it("sets loadedRecipeSourceSignal from the style", () => {
      loadEspressoShotStyleIntoCalculator(style);

      expect(loadedRecipeSourceSignal.value).toEqual({
        recipeId: style.id,
        label: style.label,
        ratio: style.ratio,
        water: style.doseOut,
        coffee: style.doseIn,
        steps: brewStepsSignal.value?.steps,
      });
    });
  });

  describe("loadEspressoProfileIntoCalculator", () => {
    const profile = ESPRESSO_PROFILES.find((item) => item.id === "blooming-espresso");
    if (!profile) throw new Error("expected the 'blooming-espresso' profile to exist in test data");

    it("populates the espresso dose-in/ratio/dose-out signals from the profile", () => {
      loadEspressoProfileIntoCalculator(profile);

      expect(selectedBrewTypeSignal.value).toBe("Espresso Shot");
      expect(espressoDoseInSignal.value).toBe(profile.doseIn);
      expect(espressoRatioSignal.value).toBe(profile.ratio);
      expect(espressoDoseOutSignal.value).toBe(profile.doseOut);
    });

    it("builds brewStepsSignal from the profile's own preinfusion/grind/water-temp, not the style-wide defaults", () => {
      loadEspressoProfileIntoCalculator(profile);

      expect(brewStepsSignal.value).toEqual({
        steps: buildEspressoSteps(
          profile.preinfusionSec,
          profile.shotTimeSec,
          profile.grind,
          profile.waterTemp,
        ),
      });
      // Sanity-check this profile's own values genuinely differ from the
      // style-wide defaults, so the assertion above isn't accidentally
      // passing by coincidence.
      expect(profile.preinfusionSec).not.toBe(ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC);
    });

    it("sets loadedRecipeSourceSignal from the profile, using its name as the label", () => {
      loadEspressoProfileIntoCalculator(profile);

      expect(loadedRecipeSourceSignal.value).toEqual({
        recipeId: profile.id,
        label: profile.name,
        ratio: profile.ratio,
        water: profile.doseOut,
        coffee: profile.doseIn,
        steps: brewStepsSignal.value?.steps,
      });
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
