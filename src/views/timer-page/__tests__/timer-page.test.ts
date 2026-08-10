import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IBrewStep, ISavedBrew } from "../../../shared/interfaces/brew.interface";
import type { IPrimedRecipe } from "../../../shared/interfaces/timer.interface";
import { savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  guidedModeSignal,
  primedRecipeSignal,
  resetTimer,
  timerRunningSignal,
  timerSecondsSignal,
  toggleTimer,
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

const steps: IBrewStep[] = [{ id: "s1", label: "Bloom", kind: "timed", seconds: 30 }];

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
    it("renders idle-actions with a 'Start timer now' button when nothing is primed, running, or elapsed", async () => {
      await mount();

      expect(element.shadowRoot?.querySelector(".idle-actions")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".controls")).toBeNull();
      const startButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Start timer now");
      expect(startButton).not.toBeUndefined();
    });

    it("does not show 'Choose from saved brews' when there are no saved brews", async () => {
      await mount();

      const pickerButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Choose from saved brews");
      expect(pickerButton).toBeUndefined();
    });

    it("shows 'Choose from saved brews' once a brew is saved", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      const pickerButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Choose from saved brews");
      expect(pickerButton).not.toBeUndefined();
    });

    it("starts the timer when 'Start timer now' is clicked", async () => {
      await mount();
      expect(timerRunningSignal.value).toBe(false);

      const startButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Start timer now");
      const innerButton = startButton?.shadowRoot?.querySelector("button");
      innerButton?.click();
      await element.updateComplete;

      expect(timerRunningSignal.value).toBe(true);
    });

    it("stops rendering idle-actions (and shows controls instead) once the timer is running", async () => {
      await mount();

      toggleTimer();
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".idle-actions")).toBeNull();
      expect(element.shadowRoot?.querySelector(".controls")).not.toBeNull();
    });

    it("stops rendering idle-actions once a recipe is primed, even while not running", async () => {
      await mount();
      expect(element.shadowRoot?.querySelector(".idle-actions")).not.toBeNull();

      primedRecipeSignal.value = primedRecipe();
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".idle-actions")).toBeNull();
      expect(element.shadowRoot?.querySelector(".controls")).not.toBeNull();
    });
  });

  describe("saved brew picker", () => {
    it("opens the picker sheet when 'Choose from saved brews' is clicked", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      const sheet = element.shadowRoot?.querySelector("brew-saved-brew-picker-sheet") as
        | (HTMLElement & { open: boolean })
        | undefined;
      expect(sheet?.open).toBe(false);

      const pickerButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Choose from saved brews");
      const innerButton = pickerButton?.shadowRoot?.querySelector("button");
      innerButton?.click();
      await element.updateComplete;

      expect(sheet?.open).toBe(true);
    });

    it("primes the timer from the selected brew and closes the picker sheet on saved-brew-select", async () => {
      savedBrewsSignal.value = [makeSavedBrew()];
      await mount();

      const pickerButton = Array.from(
        element.shadowRoot?.querySelectorAll(".idle-actions brew-button") ?? [],
      ).find((button) => button.textContent?.trim() === "Choose from saved brews");
      const innerButton = pickerButton?.shadowRoot?.querySelector("button");
      innerButton?.click();
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

  describe("brew steps card", () => {
    it("does not render a brew-steps-card when the primed recipe has no steps", async () => {
      primedRecipeSignal.value = primedRecipe({ steps: null });
      await mount();

      expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
    });

    it("renders a brew-steps-card wired to the timer's elapsed seconds when the primed recipe has steps", async () => {
      primedRecipeSignal.value = primedRecipe({ steps });
      timerSecondsSignal.value = 12;
      await mount();

      const stepsCard = element.shadowRoot?.querySelector("brew-steps-card") as
        | (HTMLElement & { startOpen: boolean; elapsedSeconds: number | null })
        | undefined;
      expect(stepsCard).not.toBeNull();
      expect(stepsCard?.startOpen).toBe(false);
      expect(stepsCard?.elapsedSeconds).toBe(12);
    });
  });

  describe("clearing a primed recipe", () => {
    it("does not show a 'Clear brew' control on the plain, unprimed stopwatch", async () => {
      await mount();
      toggleTimer();
      await element.updateComplete;

      expect(
        element.shadowRoot?.querySelector('brew-icon-button[aria-label="Clear brew"]'),
      ).toBeNull();
      expect(element.shadowRoot?.querySelector(".controls .spacer")).not.toBeNull();
    });

    it("shows a 'Clear brew' control instead of the spacer once a recipe is primed", async () => {
      primedRecipeSignal.value = primedRecipe();
      await mount();

      expect(
        element.shadowRoot?.querySelector('brew-icon-button[aria-label="Clear brew"]'),
      ).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".controls .spacer")).toBeNull();
    });

    it("unprimes the recipe and drops back to the idle base stopwatch when clicked", async () => {
      primedRecipeSignal.value = primedRecipe();
      timerSecondsSignal.value = 30;
      await mount();

      const clearButton = element.shadowRoot?.querySelector(
        'brew-icon-button[aria-label="Clear brew"]',
      );
      clearButton?.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
      await element.updateComplete;

      expect(primedRecipeSignal.value).toBeNull();
      expect(timerSecondsSignal.value).toBe(0);
      expect(element.shadowRoot?.querySelector(".idle-actions")).not.toBeNull();
    });
  });
});
