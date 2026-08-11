import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { BREW_STEPS_PRESETS } from "../../data/brew-steps-presets.data";
import type { IBrewStepsConfig, ILoadedRecipeSource } from "../../interfaces/brew.interface";
import {
  brewStepsSignal,
  loadedRecipeSourceSignal,
  selectBrewType,
  selectedBrewTypeSignal,
  updateBrewStepsConfig,
} from "../brew-steps.store";
import { deleteAllSavedBrews } from "../brew.store";
import {
  coffeeSignal,
  dismissPrimedBanner,
  ozSignal,
  primeCalculatorForBrew,
  primeCalculatorForRatio,
  primedBrewTypeSignal,
  primedFromNameSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  waterSignal,
} from "../calculator.store";

describe("calculator.store", () => {
  beforeEach(() => {
    resetCalculator();
    deleteAllSavedBrews();
  });

  it("computes coffee when water is entered", () => {
    setWater("480");
    expect(coffeeSignal.value).toBe(30);
    expect(ozSignal.value).not.toBe("");
  });

  it("keeps water and oz in sync", () => {
    setOz("16");
    expect(waterSignal.value).toBe("454");
  });

  it("recomputes coffee when the ratio changes", () => {
    setWater("480");
    setRatio("15");
    expect(coffeeSignal.value).toBe(32);
  });

  describe("negative-number clamping (gh-13)", () => {
    it("clamps a negative water value to 0 instead of computing a negative brew", () => {
      setWater("-15");
      expect(waterSignal.value).toBe("0");
      expect(ozSignal.value).toBe("0");
    });

    it("clamps a negative oz value to 0 and keeps water in sync", () => {
      setOz("-8");
      expect(ozSignal.value).toBe("0");
      expect(waterSignal.value).toBe("0");
    });

    it("clamps a negative ratio to 0 rather than a negative coffee-needed figure", () => {
      setWater("480");
      setRatio("-16");
      expect(ratioSignal.value).toBe("0");
      // A zero ratio can't compute a coffee figure - it's dropped, not negative.
      expect(coffeeSignal.value).toBe(30);
    });

    it("leaves partial/in-progress input (bare '-') untouched rather than forcing it to 0", () => {
      setWater("-");
      expect(waterSignal.value).toBe("-");
    });
  });

  it("resets to defaults", () => {
    setWater("480");
    resetCalculator();
    expect(waterSignal.value).toBe("");
    expect(coffeeSignal.value).toBeNull();
    expect(ratioSignal.value).toBe("16");
  });

  it("primes the calculator with a shared brew's exact numbers", () => {
    primeCalculatorForBrew({ brewType: "Pour-over", ratio: 15, water: 300, coffee: 20, oz: 10.58 });
    expect(ratioSignal.value).toBe("15");
    expect(waterSignal.value).toBe("300");
    expect(ozSignal.value).toBe("10.58");
    expect(coffeeSignal.value).toBe(20);
  });

  describe("dismissPrimedBanner", () => {
    it("clears only the banner name, not the entered numbers", () => {
      primeCalculatorForBrew({
        brewType: "Pour-over",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10.58,
      });
      primedFromNameSignal.value = "Sunday morning pour";

      dismissPrimedBanner();

      expect(primedFromNameSignal.value).toBeNull();
      expect(waterSignal.value).toBe("300");
      expect(coffeeSignal.value).toBe(20);
    });
  });

  describe("resetCalculator", () => {
    it("also clears the primed banner and brew type", () => {
      primeCalculatorForBrew({
        brewType: "Pour-over",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10.58,
      });
      primedFromNameSignal.value = "Sunday morning pour";

      resetCalculator();

      expect(primedFromNameSignal.value).toBeNull();
      expect(primedBrewTypeSignal.value).toBeNull();
    });

    it("also clears the brew-steps state, re-opening the brew-type chooser", () => {
      selectBrewType("Aeropress");
      updateBrewStepsConfig({ steps: [] });
      loadedRecipeSourceSignal.value = {
        recipeId: "x",
        label: "x",
        ratio: 1,
        water: 1,
        coffee: 1,
        steps: [],
      };

      resetCalculator();

      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(brewStepsSignal.value).toBeNull();
      expect(loadedRecipeSourceSignal.value).toBeNull();
    });
  });

  describe("primeCalculatorForRatio", () => {
    it("primes the ratio and clears the water/coffee fields", () => {
      primeCalculatorForRatio(18);

      expect(ratioSignal.value).toBe("18");
      expect(waterSignal.value).toBe("");
      expect(coffeeSignal.value).toBeNull();
      expect(primedBrewTypeSignal.value).toBeNull();
    });

    it("also clears the brew-steps state, since no specific brew type is known here", () => {
      selectBrewType("Aeropress");

      primeCalculatorForRatio(18);

      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(brewStepsSignal.value).toBeNull();
      expect(loadedRecipeSourceSignal.value).toBeNull();
    });

    it("selects the given brew type and seeds its preset instead of reopening the chooser, when a type is passed", () => {
      primeCalculatorForRatio(15, "V60");

      expect(selectedBrewTypeSignal.value).toBe("V60");
      expect(brewStepsSignal.value).toEqual(BREW_STEPS_PRESETS.V60);
    });

    it("lets the explicit ratioDefault win over whatever selecting the brew type implies", () => {
      primeCalculatorForRatio(13.5, "V60");

      expect(ratioSignal.value).toBe("13.5");
    });

    it("clears any prior recipe-load provenance when priming with a known brew type", () => {
      selectBrewType("Aeropress");
      loadedRecipeSourceSignal.value = {
        recipeId: "x",
        label: "x",
        ratio: 1,
        water: 1,
        coffee: 1,
        steps: [],
      };

      primeCalculatorForRatio(15, "V60");

      expect(loadedRecipeSourceSignal.value).toBeNull();
    });

    it("leaves brewStepsSignal null for a known brew type with no preset", () => {
      primeCalculatorForRatio(4, "Cold Brew");

      expect(selectedBrewTypeSignal.value).toBe("Cold Brew");
      expect(brewStepsSignal.value).toBeNull();
    });
  });

  describe("primeCalculatorForBrew", () => {
    it("seeds the brew-type/brew-steps/recipe-source signals from the brew's own fields", () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "X", kind: "note", value: "y" }],
      };
      const recipeSource: ILoadedRecipeSource = {
        recipeId: "2025-1",
        label: "Némo Pop · 2025, 1st place",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        steps: brewSteps.steps,
      };

      primeCalculatorForBrew({
        brewType: "Aeropress",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        oz: 6,
        brewSteps,
        recipeSource,
      });

      expect(selectedBrewTypeSignal.value).toBe("Aeropress");
      expect(brewStepsSignal.value).toEqual(brewSteps);
      expect(loadedRecipeSourceSignal.value).toEqual(recipeSource);
    });

    it("falls back to the type's preset when the brew predates this feature (no brewSteps of its own)", () => {
      primeCalculatorForBrew({
        brewType: "Aeropress",
        ratio: 16,
        water: 480,
        coffee: 30,
        oz: 16.2,
      });

      expect(selectedBrewTypeSignal.value).toBe("Aeropress");
      expect(brewStepsSignal.value).toEqual(BREW_STEPS_PRESETS.Aeropress);
      expect(loadedRecipeSourceSignal.value).toBeNull();
    });

    it("leaves brewStepsSignal null for a type with neither its own steps nor a preset", () => {
      primeCalculatorForBrew({
        brewType: "Cold Brew",
        ratio: 4,
        water: 500,
        coffee: 125,
        oz: 16.9,
      });

      expect(selectedBrewTypeSignal.value).toBe("Cold Brew");
      expect(brewStepsSignal.value).toBeNull();
    });
  });
});
