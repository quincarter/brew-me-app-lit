import { beforeEach, describe, expect, it } from "vitest";
import type { IPrimedRecipe } from "../../interfaces/timer.interface";
import {
  guidedModeSignal,
  primedRecipeSignal,
  primeTimerForRecipe,
  resetTimer,
  setGuidedMode,
  setGuidedTargetSeconds,
  timerRunningSignal,
  timerSecondsSignal,
} from "../timer.store";

const recipe: IPrimedRecipe = {
  name: "V60",
  coffee: 20,
  water: 300,
  ratio: 15,
  targetSeconds: 180,
};

const recipeWithoutTarget: IPrimedRecipe = {
  name: "Cold Brew",
  coffee: 100,
  water: 800,
  ratio: 8,
  targetSeconds: null,
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
});
