import { signal } from "@lit-labs/preact-signals";
import type { IShareableBrew } from "../interfaces/brew.interface";
import { coffeeForWater, gramsToOunces, ouncesToGrams } from "../utilities/ratio.utility";

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

export const setRatio = (value: string): void => {
  const ratio = Number.parseFloat(value);
  const water = Number.parseFloat(waterSignal.value);
  ratioSignal.value = value;
  if (!Number.isNaN(water) && ratio) {
    coffeeSignal.value = coffeeForWater(water, ratio);
  }
};

export const setWater = (value: string): void => {
  const grams = Number.parseFloat(value);
  const ratio = Number.parseFloat(ratioSignal.value);
  waterSignal.value = value;
  ozSignal.value = Number.isNaN(grams) ? "" : String(gramsToOunces(grams));
  coffeeSignal.value = Number.isNaN(grams) || !ratio ? null : coffeeForWater(grams, ratio);
};

export const setOz = (value: string): void => {
  const ounces = Number.parseFloat(value);
  const ratio = Number.parseFloat(ratioSignal.value);
  const grams = Number.isNaN(ounces) ? "" : String(ouncesToGrams(ounces));
  ozSignal.value = value;
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
};

/** Primes the calculator with a guide's default ratio - used by "Calculate this ratio" on the guide detail screen. */
export const primeCalculatorForRatio = (ratioDefault: number): void => {
  waterSignal.value = "";
  ozSignal.value = "";
  coffeeSignal.value = null;
  ratioSignal.value = String(ratioDefault);
  primedBrewTypeSignal.value = null;
};

/** Primes the calculator with a shared brew's exact numbers - used by the Share screen's "Open in Calculator" action and by `brewAgain` below. */
export const primeCalculatorForBrew = (brew: IShareableBrew): void => {
  ratioSignal.value = String(brew.ratio);
  waterSignal.value = String(brew.water);
  ozSignal.value = String(brew.oz);
  coffeeSignal.value = brew.coffee;
  primedBrewTypeSignal.value = brew.brewType;
};

/** Clears just the "Loaded from" banner - does not reset the entered numbers, unlike `resetCalculator`. */
export const dismissPrimedBanner = (): void => {
  primedFromNameSignal.value = null;
};
