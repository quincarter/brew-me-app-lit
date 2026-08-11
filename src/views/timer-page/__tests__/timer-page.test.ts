import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../../shared/interfaces/brew.interface";
import type { IPrimedRecipe } from "../../../shared/interfaces/timer.interface";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  guidedModeSignal,
  primedRecipeSignal,
  resetTimer,
  timerRunningSignal,
  timerSecondsSignal,
} from "../../../shared/stores/timer.store";
import "../timer-page";
import type { TimerPage } from "../timer-page";

const makeSavedBrew = (overrides: Partial<ISavedBrew> = {}): ISavedBrew => ({
  id: 1,
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 11,
  createdAt: Date.now(),
  ...overrides,
});

const primedRecipe = (overrides: Partial<IPrimedRecipe> = {}): IPrimedRecipe => ({
  name: "V60",
  brewType: "V60",
  coffee: 20,
  water: 320,
  ratio: 16,
  targetSeconds: 210,
  steps: null,
  ...overrides,
});

describe("timer-page", () => {
  let element: TimerPage;

  const mount = async (): Promise<void> => {
    element = document.createElement("timer-page") as TimerPage;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  const dial = (): (HTMLElement & { guided: boolean; countdown: boolean; idle: boolean }) | null =>
    element.shadowRoot?.querySelector("brew-timer-dial") as
      | (HTMLElement & { guided: boolean; countdown: boolean; idle: boolean })
      | null;

  const controls = ():
    | (HTMLElement & {
        idle: boolean;
        running: boolean;
        hasSavedBrews: boolean;
        hasRecipe: boolean;
      })
    | null =>
    element.shadowRoot?.querySelector("brew-timer-controls") as
      | (HTMLElement & {
          idle: boolean;
          running: boolean;
          hasSavedBrews: boolean;
          hasRecipe: boolean;
        })
      | null;

  const recipePanel = (): (HTMLElement & { recipe: IPrimedRecipe | null }) | null =>
    element.shadowRoot?.querySelector("brew-timer-recipe-panel") as
      | (HTMLElement & { recipe: IPrimedRecipe | null })
      | null;

  beforeEach(() => {
    resetTimer();
    primedRecipeSignal.value = null;
    guidedModeSignal.value = "countdown";
    savedBrewsSignal.value = [];
  });

  afterEach(() => {
    resetTimer();
    element.remove();
  });

  describe("title", () => {
    it("shows the generic title when unprimed", async () => {
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("Pour-over Timer");
    });

    it("shows the generic title when primed with a brewType of null (custom/unmatched brew type)", async () => {
      primedRecipeSignal.value = primedRecipe({ brewType: null });
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("Pour-over Timer");
    });

    it("shows a brewType-specific title when primed with a matched brew guide entry", async () => {
      primedRecipeSignal.value = primedRecipe({ brewType: "V60" });
      await mount();

      const topBar = element.shadowRoot?.querySelector("brew-top-bar") as
        | (HTMLElement & { title: string })
        | undefined;
      expect(topBar?.title).toBe("V60 Timer");
    });
  });

  describe("idle state", () => {
    it("passes idle down to brew-timer-controls when nothing is primed, running, or elapsed", async () => {
      await mount();

      expect(controls()?.idle).toBe(true);
    });

    it("does not tell brew-timer-controls there are saved brews when there are none", async () => {
      await mount();

      expect(controls()?.hasSavedBrews).toBe(false);
    });

    it("tells brew-timer-controls there are saved brews once one is saved", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      expect(controls()?.hasSavedBrews).toBe(true);
    });

    it("starts the timer when brew-timer-controls fires start-click", async () => {
      await mount();
      expect(timerRunningSignal.value).toBe(false);

      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(timerRunningSignal.value).toBe(true);
    });

    it("passes idle=false to brew-timer-controls once the timer is running", async () => {
      await mount();

      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(controls()?.idle).toBe(false);
    });

    it("passes idle=false once a recipe is primed, even while not running", async () => {
      await mount();
      expect(controls()?.idle).toBe(true);

      primedRecipeSignal.value = primedRecipe();
      await element.updateComplete;

      expect(controls()?.idle).toBe(false);
    });
  });

  describe("dial", () => {
    it("is not guided and not counting down for a plain, unprimed stopwatch", async () => {
      await mount();

      expect(dial()?.guided).toBe(false);
      expect(dial()?.countdown).toBe(false);
    });

    it("is guided and counting down once a recipe with a target is primed in countdown mode", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      guidedModeSignal.value = "countdown";
      await mount();

      expect(dial()?.guided).toBe(true);
      expect(dial()?.countdown).toBe(true);
    });

    it("is guided but not counting down once switched to count-up mode", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      guidedModeSignal.value = "countup";
      await mount();

      expect(dial()?.guided).toBe(true);
      expect(dial()?.countdown).toBe(false);
    });
  });

  describe("recipe panel", () => {
    it("does not render brew-timer-recipe-panel when unprimed", async () => {
      await mount();

      expect(recipePanel()).toBeNull();
    });

    it("renders brew-timer-recipe-panel with the primed recipe once one is set", async () => {
      const recipe = primedRecipe();
      primedRecipeSignal.value = recipe;
      await mount();

      expect(recipePanel()?.recipe).toEqual(recipe);
    });

    it("updates the guided mode when brew-timer-recipe-panel fires mode-change", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("mode-change", { detail: "countup", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(guidedModeSignal.value).toBe("countup");
    });

    it("updates the target seconds when brew-timer-recipe-panel fires target-change", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("target-change", { detail: "5", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.targetSeconds).toBe(300);
    });

    it("ignores an invalid target-change value", async () => {
      primedRecipeSignal.value = primedRecipe({ targetSeconds: 210 });
      await mount();

      recipePanel()?.dispatchEvent(
        new CustomEvent("target-change", { detail: "not a number", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.targetSeconds).toBe(210);
    });
  });

  describe("saved brew picker", () => {
    it("opens the picker sheet when brew-timer-controls fires choose-saved-click", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      const sheet = element.shadowRoot?.querySelector("brew-saved-brew-picker-sheet") as
        | (HTMLElement & { open: boolean })
        | undefined;
      expect(sheet?.open).toBe(false);

      controls()?.dispatchEvent(
        new CustomEvent("choose-saved-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(sheet?.open).toBe(true);
    });

    it("primes the timer from the selected brew and closes the picker sheet on saved-brew-select", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      controls()?.dispatchEvent(
        new CustomEvent("choose-saved-click", { bubbles: true, composed: true }),
      );
      await element.updateComplete;

      const sheet = element.shadowRoot?.querySelector("brew-saved-brew-picker-sheet") as
        | (HTMLElement & { open: boolean })
        | undefined;
      expect(sheet?.open).toBe(true);

      const selectedBrew = makeSavedBrew({ id: 99, brewType: "Aeropress", name: "Trip brew" });
      sheet?.dispatchEvent(
        new CustomEvent<ISavedBrew>("saved-brew-select", {
          detail: selectedBrew,
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      expect(primedRecipeSignal.value?.name).toBe("Trip brew");
      expect(primedRecipeSignal.value?.brewType).toBe("Aeropress");
      expect(sheet?.open).toBe(false);
    });
  });

  describe("clearing a primed recipe", () => {
    it("does not tell brew-timer-controls there's a recipe on the plain, unprimed stopwatch", async () => {
      await mount();
      controls()?.dispatchEvent(new CustomEvent("start-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(controls()?.hasRecipe).toBe(false);
    });

    it("tells brew-timer-controls there's a recipe once one is primed", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      expect(controls()?.hasRecipe).toBe(true);
    });

    it("unprimes the recipe and drops back to the idle base stopwatch on clear-click", async () => {
      primedRecipeSignal.value = primedRecipe();
      timerSecondsSignal.value = 30;
      await mount();

      controls()?.dispatchEvent(new CustomEvent("clear-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(primedRecipeSignal.value).toBeNull();
      expect(timerSecondsSignal.value).toBe(0);
      expect(controls()?.idle).toBe(true);
    });
  });
});
