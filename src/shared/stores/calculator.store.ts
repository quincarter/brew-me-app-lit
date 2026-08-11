import { signal } from "@lit-labs/preact-signals";
import { BREW_STEPS_PRESETS } from "../data/brew-steps-presets.data";
import type { IShareableBrew } from "../interfaces/brew.interface";
import { coffeeForWater, gramsToOunces, ouncesToGrams } from "../utilities/ratio.utility";
import {
  brewStepsSignal,
  clearBrewStepsState,
  loadedRecipeSourceSignal,
  selectBrewType,
  selectedBrewTypeSignal,
} from "./brew-steps.store";

/**
 * Ephemeral calculator state. Deliberately *not* persisted (unlike
 * `brew.store`'s saved brews) - it should reset on reload, same as the
 * source design's in-memory component state.
 */
export const ratioSignal = signal<string>("16");
export const waterSignal = signal<string>("");
export const ozSignal = signal<string>("");
export const coffeeSignal = signal<number | null>(null);

/** Set when the calculator was reached via "Brew again" - the display name shown in the dismissible "Loaded from" banner. Null otherwise. */
export const primedFromNameSignal = signal<string | null>(null);

/**
 * The brew type the calculator was last primed from via `primeCalculatorForBrew`
 * (e.g. "V60") - used to look up a guided timer's target duration from
 * `BREW_GUIDE`. Null when unprimed, primed from a plain ratio default, or
 * primed from a custom type with no matching guide entry.
 */
export const primedBrewTypeSignal = signal<string | null>(null);

/**
 * Parses a field's raw text into a non-negative number. A value that parses
 * negative (e.g. mid-typing "-15") is clamped to 0 - both the returned
 * number *and* the string that should replace the field's raw value - so a
 * negative number can never flow into a signal or a derived calculation.
 * `NaN` (empty string, bare "-", "5.") passes through untouched so partial
 * input while typing isn't stomped on.
 */
const parseNonNegative = (raw: string): { raw: string; value: number } => {
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed) || parsed >= 0) return { raw, value: parsed };
  return { raw: "0", value: 0 };
};

export const setRatio = (value: string): void => {
  const { raw, value: ratio } = parseNonNegative(value);
  const water = Number.parseFloat(waterSignal.value);
  ratioSignal.value = raw;
  if (!Number.isNaN(water) && ratio) {
    coffeeSignal.value = coffeeForWater(water, ratio);
  }
};

export const setWater = (value: string): void => {
  const { raw, value: grams } = parseNonNegative(value);
  const ratio = Number.parseFloat(ratioSignal.value);
  waterSignal.value = raw;
  ozSignal.value = Number.isNaN(grams) ? "" : String(gramsToOunces(grams));
  coffeeSignal.value = Number.isNaN(grams) || !ratio ? null : coffeeForWater(grams, ratio);
};

export const setOz = (value: string): void => {
  const { raw, value: ounces } = parseNonNegative(value);
  const ratio = Number.parseFloat(ratioSignal.value);
  const grams = Number.isNaN(ounces) ? "" : String(ouncesToGrams(ounces));
  ozSignal.value = raw;
  waterSignal.value = grams;
  coffeeSignal.value =
    grams === "" || !ratio ? null : coffeeForWater(Number.parseFloat(grams), ratio);
};

export const resetCalculator = (): void => {
  waterSignal.value = "";
  ozSignal.value = "";
  coffeeSignal.value = null;
  ratioSignal.value = "16";
  primedFromNameSignal.value = null;
  primedBrewTypeSignal.value = null;
  // Also re-opens the brew-type chooser, matching a fresh visit to the Calculator.
  clearBrewStepsState();
};

/**
 * Primes the calculator with a guide's default ratio - used by "Calculate
 * this ratio" on the guide detail screen. When `brewType` is known (the
 * common case - the guide detail screen always knows which method it's
 * showing), it's threaded straight into `selectBrewType` so the Calculator
 * lands on the pre-filled form with that type's Brew Steps preset already
 * seeded, instead of dead-ending on the brew-type chooser. The explicit
 * `ratioDefault` still wins over whatever `selectBrewType` would otherwise
 * imply, since it may differ from the type's own guide ratio hint.
 * Omitting `brewType` keeps the old chooser-reopening behavior for callers
 * that genuinely don't know a specific type.
 */
export const primeCalculatorForRatio = (ratioDefault: number, brewType?: string): void => {
  waterSignal.value = "";
  ozSignal.value = "";
  coffeeSignal.value = null;
  primedBrewTypeSignal.value = null;
  if (brewType) {
    selectBrewType(brewType);
  } else {
    // No specific brew type is known here, so send the person back through
    // the chooser rather than guessing one.
    clearBrewStepsState();
  }
  ratioSignal.value = String(ratioDefault);
};

/** Primes the calculator with a shared brew's exact numbers - used by the Share screen's "Open in Calculator" action and by `brewAgain` below. */
export const primeCalculatorForBrew = (brew: IShareableBrew): void => {
  ratioSignal.value = String(brew.ratio);
  waterSignal.value = String(brew.water);
  ozSignal.value = String(brew.oz);
  coffeeSignal.value = brew.coffee;
  primedBrewTypeSignal.value = brew.brewType;

  selectedBrewTypeSignal.value = brew.brewType;
  // A brew saved before this feature shipped has no `brewSteps` of its own -
  // fall back to the type's canned preset (if any) so it still gets a card.
  brewStepsSignal.value = brew.brewSteps ?? BREW_STEPS_PRESETS[brew.brewType] ?? null;
  loadedRecipeSourceSignal.value = brew.recipeSource ?? null;
};

/** Clears just the "Loaded from" banner - does not reset the entered numbers, unlike `resetCalculator`. */
export const dismissPrimedBanner = (): void => {
  primedFromNameSignal.value = null;
};
