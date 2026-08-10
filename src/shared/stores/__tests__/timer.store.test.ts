import { beforeEach, describe, expect, it } from "vitest";
import { BREW_STEPS_PRESETS } from "../../data/brew-steps-presets.data";
import type { IBrewStep, ISavedBrew } from "../../interfaces/brew.interface";
import type { IPrimedRecipe } from "../../interfaces/timer.interface";
import {
  clearPrimedRecipe,
  guidedModeSignal,
  primedRecipeSignal,
  primeTimerForRecipe,
  primeTimerForSavedBrew,
  resetTimer,
  setGuidedMode,
  setGuidedTargetSeconds,
  timerRunningSignal,
  timerSecondsSignal,
} from "../timer.store";

const recipe: IPrimedRecipe = {
  name: "V60",
  brewType: "V60",
  coffee: 20,
  water: 300,
  ratio: 15,
  targetSeconds: 120,
  steps: BREW_STEPS_PRESETS.V60.steps,
};

const recipeWithoutTarget: IPrimedRecipe = {
  name: "Cold Brew",
  brewType: "Cold Brew",
  coffee: 100,
  water: 800,
  ratio: 8,
  targetSeconds: null,
  steps: null,
};

describe("timer.store", () => {
  beforeEach(() => {
    resetTimer();
    primedRecipeSignal.value = null;
    guidedModeSignal.value = "countdown";
  });

  describe("primeTimerForRecipe", () => {
    it("sets the recipe and resets elapsed time to 0", () => {
      timerSecondsSignal.value = 42;

      primeTimerForRecipe(recipe);

      expect(primedRecipeSignal.value).toEqual(recipe);
      expect(timerSecondsSignal.value).toBe(0);
      expect(timerRunningSignal.value).toBe(false);
    });

    it("does not leave the recipe wiped by its own internal reset call", () => {
      primeTimerForRecipe(recipe);

      expect(primedRecipeSignal.value).not.toBeNull();
      expect(primedRecipeSignal.value).toEqual(recipe);
    });

    it("defaults to countdown mode when the recipe has a target", () => {
      primeTimerForRecipe(recipe);

      expect(guidedModeSignal.value).toBe("countdown");
    });

    it("defaults to countup mode when the recipe has no target (e.g. Cold Brew)", () => {
      primeTimerForRecipe(recipeWithoutTarget);

      expect(guidedModeSignal.value).toBe("countup");
    });
  });

  describe("primeTimerForSavedBrew", () => {
    it("uses the matching BREW_GUIDE entry's brewTimeSeconds as the target, and the brew's display name when no custom name is set", () => {
      const brew: ISavedBrew = {
        id: 1,
        brewType: "V60",
        ratio: 16,
        water: 320,
        coffee: 20,
        oz: 11,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value).toEqual({
        name: "V60",
        brewType: "V60",
        coffee: 20,
        water: 320,
        ratio: 16,
        targetSeconds: 120,
        steps: BREW_STEPS_PRESETS.V60.steps,
      });
    });

    it("falls back to the custom name over the brewType when one is set", () => {
      const brew: ISavedBrew = {
        id: 2,
        brewType: "V60",
        name: "Sunday morning pour",
        ratio: 16,
        water: 320,
        coffee: 20,
        oz: 11,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.name).toBe("Sunday morning pour");
    });

    it("sets targetSeconds and brewType to null when the brewType has no matching guide entry", () => {
      const brew: ISavedBrew = {
        id: 3,
        brewType: "My Weird Method",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.targetSeconds).toBeNull();
      expect(primedRecipeSignal.value?.brewType).toBeNull();
    });

    it("sets targetSeconds to null when the matching guide entry has no brewTimeSeconds (e.g. Cold Brew)", () => {
      const brew: ISavedBrew = {
        id: 4,
        brewType: "Cold Brew",
        ratio: 4,
        water: 800,
        coffee: 200,
        oz: 27,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.targetSeconds).toBeNull();
      // Cold Brew has a BREW_GUIDE entry (so brewType/title still resolve) but no BREW_STEPS_PRESETS entry.
      expect(primedRecipeSignal.value?.brewType).toBe("Cold Brew");
      expect(primedRecipeSignal.value?.steps).toBeNull();
    });

    it("uses the saved brew's own brewSteps over the type's canned preset when both exist", () => {
      const customSteps: IBrewStep[] = [
        { id: "custom-1", label: "Bloom", kind: "timed", seconds: 40 },
      ];
      const brew: ISavedBrew = {
        id: 5,
        brewType: "V60",
        ratio: 16,
        water: 320,
        coffee: 20,
        oz: 11,
        createdAt: Date.now(),
        brewSteps: { steps: customSteps },
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.steps).toEqual(customSteps);
    });

    it("falls back to the type's canned preset when the saved brew has no brewSteps of its own", () => {
      const brew: ISavedBrew = {
        id: 6,
        brewType: "Aeropress",
        ratio: 15,
        water: 250,
        coffee: 17,
        oz: 8,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.steps).toEqual(BREW_STEPS_PRESETS.Aeropress.steps);
    });

    it("sets steps to null when neither the brew nor its type has a step sequence", () => {
      const brew: ISavedBrew = {
        id: 7,
        brewType: "My Weird Method",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10,
        createdAt: Date.now(),
      };

      primeTimerForSavedBrew(brew);

      expect(primedRecipeSignal.value?.steps).toBeNull();
    });
  });

  describe("setGuidedMode", () => {
    it("switches to countup", () => {
      primeTimerForRecipe(recipe);

      setGuidedMode("countup");

      expect(guidedModeSignal.value).toBe("countup");
    });

    it("fills in a default target when switching a targetless recipe to countdown", () => {
      primeTimerForRecipe(recipeWithoutTarget);
      expect(primedRecipeSignal.value?.targetSeconds).toBeNull();

      setGuidedMode("countdown");

      expect(guidedModeSignal.value).toBe("countdown");
      expect(primedRecipeSignal.value?.targetSeconds).toBeGreaterThan(0);
    });
  });

  describe("setGuidedTargetSeconds", () => {
    it("overrides the primed recipe's target time", () => {
      primeTimerForRecipe(recipe);

      setGuidedTargetSeconds(240);

      expect(primedRecipeSignal.value?.targetSeconds).toBe(240);
      expect(primedRecipeSignal.value?.name).toBe(recipe.name);
    });

    it("does nothing when the timer isn't primed", () => {
      setGuidedTargetSeconds(240);

      expect(primedRecipeSignal.value).toBeNull();
    });
  });

  describe("resetTimer", () => {
    it("restarts the elapsed clock without clearing the primed recipe", () => {
      primeTimerForRecipe(recipe);
      timerSecondsSignal.value = 42;

      resetTimer();

      expect(primedRecipeSignal.value).toEqual(recipe);
      expect(timerSecondsSignal.value).toBe(0);
      expect(timerRunningSignal.value).toBe(false);
    });

    it("leaves an unprimed timer unprimed", () => {
      resetTimer();

      expect(primedRecipeSignal.value).toBeNull();
    });
  });

  describe("clearPrimedRecipe", () => {
    it("unprimes the recipe and restarts the elapsed clock, dropping back to the idle base stopwatch", () => {
      primeTimerForRecipe(recipe);
      timerSecondsSignal.value = 42;
      timerRunningSignal.value = true;

      clearPrimedRecipe();

      expect(primedRecipeSignal.value).toBeNull();
      expect(timerSecondsSignal.value).toBe(0);
      expect(timerRunningSignal.value).toBe(false);
    });

    it("is a no-op on an already-unprimed timer beyond restarting the clock", () => {
      clearPrimedRecipe();

      expect(primedRecipeSignal.value).toBeNull();
    });
  });
});
