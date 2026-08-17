import { effect, signal } from "@lit-labs/preact-signals";
import { BREW_GUIDE } from "../data/brew-content.data";
import { BREW_STEPS_PRESETS } from "../data/brew-steps-presets.data";
import type { ISavedBrew } from "../interfaces/brew.interface";
import type { IPrimedRecipe } from "../interfaces/timer.interface";
import { computeTotalStepSeconds } from "../utilities/brew-step-progress.utility";
import { getBrewDisplayName } from "../utilities/brew-display.utility";
import { setWakeLockActive } from "../utilities/wake-lock.utility";
import { markBrewedNow } from "./brew.store";
import { getBrewTypeFeatures } from "./brew-type-features.store";
import { addShot } from "./shot.store";
import { timerCountStyleSignal } from "./timer-settings.store";
import {
  clearTelemetry,
  monitorSamplesSignal,
  scaleSamplesSignal,
  sealTelemetry,
  startTelemetryRecording,
  telemetrySealedSignal,
} from "./telemetry.store";

/**
 * Module-level (not component-level) timer state, so the pour-over countdown
 * keeps running even if the user navigates away from the Timer screen and
 * back.
 */
export const timerSecondsSignal = signal(0);
export const timerRunningSignal = signal(false);

/** Keeps the screen awake for the duration of a running brew, so the pour-over timer isn't lost to the display sleeping mid-brew. */
effect(() => {
  setWakeLockActive(timerRunningSignal.value);
});

/**
 * Set when the Timer screen was reached via "Start guided timer" - null for
 * a plain, unprimed stopwatch. Persists across navigation and across
 * `resetTimer()` calls, same as the elapsed time itself - "Reset" restarts
 * the clock for the current recipe, it doesn't exit guided mode. Only
 * priming a new recipe (or a full page reload) replaces it.
 */
export const primedRecipeSignal = signal<IPrimedRecipe | null>(null);

export type GuidedTimerMode = "countdown" | "countup";

/** Only meaningful while `primedRecipeSignal` is set - a plain, unprimed timer always counts up. */
export const guidedModeSignal = signal<GuidedTimerMode>("countdown");

const DEFAULT_GUIDED_TARGET_SECONDS = 300;

let intervalHandle: ReturnType<typeof setInterval> | undefined;

export const toggleTimer = (): void => {
  if (timerRunningSignal.value) {
    clearInterval(intervalHandle);
    timerRunningSignal.value = false;
    return;
  }

  // A sealed session (via `stopSession`) is done - only `resetTimer`/`clearPrimedRecipe`
  // (both of which clear the seal) can start counting again, so a stray resume can't
  // silently keep ticking on top of an already-recorded shot.
  if (telemetrySealedSignal.value) return;

  startTelemetryRecording();
  intervalHandle = setInterval(() => {
    timerSecondsSignal.value += 1;
  }, 1000);
  timerRunningSignal.value = true;
};

/** Restarts the elapsed clock at 0 - deliberately leaves `primedRecipeSignal` alone (see its doc comment). */
export const resetTimer = (): void => {
  clearInterval(intervalHandle);
  timerRunningSignal.value = false;
  timerSecondsSignal.value = 0;
  clearTelemetry();
};

/**
 * Freezes the timer WITHOUT zeroing elapsed time (unlike `resetTimer`), seals
 * the telemetry buffers so a late BLE notification can't keep appending, and
 * - when the running session was primed from a saved brew - records a sealed
 * `IBrewShot` against it and stamps the brew as brewed. The counterpart to
 * `resetTimer` for "I'm done pulling this shot" rather than "start over".
 * A no-op once already sealed, so it can't be re-invoked (e.g. via a stray
 * `toggleTimer` + second seal) into recording a duplicate, stale shot.
 * Skips recording a shot entirely for a brew type whose `telemetryMode` is
 * "off" (e.g. Aeropress) - that lock means telemetry can't genuinely be
 * tracked for it, so a connected device's samples would just be persisted
 * data nobody can ever see (its Saved Detail hides the Brews/Shots section).
 */
export const stopSession = (): void => {
  if (telemetrySealedSignal.value) return;

  clearInterval(intervalHandle);
  timerRunningSignal.value = false;
  sealTelemetry();

  const recipe = primedRecipeSignal.value;
  if (recipe?.savedBrewId === undefined) return;

  const telemetryLocked =
    recipe.brewType !== null && getBrewTypeFeatures(recipe.brewType).telemetryMode === "off";
  if (!telemetryLocked) {
    addShot({
      savedBrewId: recipe.savedBrewId,
      elapsedSeconds: timerSecondsSignal.value,
      scaleSamples: scaleSamplesSignal.value,
      monitorSamples: monitorSamplesSignal.value,
    });
  }
  markBrewedNow(recipe.savedBrewId);
};

/** Unprimes the timer, dropping it back to the plain base stopwatch (and its "start now or choose a saved brew" idle state) - the counterpart to `resetTimer` deliberately keeping the recipe, for when the person wants to leave the guided brew entirely rather than just restart its clock. */
export const clearPrimedRecipe = (): void => {
  resetTimer();
  primedRecipeSignal.value = null;
};

/** Primes the timer with a recipe from the Calculator's "Start guided timer" action, and restarts the clock at 0. */
export const primeTimerForRecipe = (recipe: IPrimedRecipe): void => {
  resetTimer();
  const stepTotal = computeTotalStepSeconds(recipe.steps);
  const targetSeconds = stepTotal ?? recipe.targetSeconds;
  const primed = { ...recipe, targetSeconds };
  primedRecipeSignal.value = primed;
  // The persisted "count style" setting is only meaningful when there's something to
  // count down to - with no target, "countdown" would have nothing to count down from,
  // so this always forces "countup" regardless of the stored preference.
  guidedModeSignal.value = targetSeconds !== null ? timerCountStyleSignal.value : "countup";
};

/** Primes the timer from an already-saved brew - looks up its guide entry (if any) for the guided target duration and title, same lookup the Calculator's guided-timer flow used to do inline. */
export const primeTimerForSavedBrew = (brew: ISavedBrew): void => {
  const guide = BREW_GUIDE.find((item) => item.name === brew.brewType);
  const steps = brew.brewSteps?.steps ?? BREW_STEPS_PRESETS[brew.brewType]?.steps ?? null;
  const stepTotal = computeTotalStepSeconds(steps);
  const targetSeconds = stepTotal ?? guide?.brewTimeSeconds ?? null;

  primeTimerForRecipe({
    name: getBrewDisplayName(brew),
    brewType: guide ? brew.brewType : null,
    coffee: brew.coffee,
    water: brew.water,
    ratio: brew.ratio,
    targetSeconds,
    steps,
    savedBrewId: brew.id,
  });
};

/** Switches a guided brew between counting down to its target and counting up like a plain stopwatch. */
export const setGuidedMode = (mode: GuidedTimerMode): void => {
  guidedModeSignal.value = mode;
  const recipe = primedRecipeSignal.value;
  if (mode === "countdown" && recipe && recipe.targetSeconds === null) {
    primedRecipeSignal.value = { ...recipe, targetSeconds: DEFAULT_GUIDED_TARGET_SECONDS };
  }
};

/** Lets the person pouring override the guided target time (e.g. a method with no built-in default, or to taste). */
export const setGuidedTargetSeconds = (seconds: number): void => {
  const recipe = primedRecipeSignal.value;
  if (!recipe) return;
  primedRecipeSignal.value = { ...recipe, targetSeconds: Math.max(0, Math.round(seconds)) };
};
