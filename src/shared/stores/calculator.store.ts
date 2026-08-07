import { signal } from "@lit-labs/preact-signals";
import { coffeeForWater, gramsToOunces, ouncesToGrams } from "../utilities/ratio.utility";

/**
 * Ephemeral calculator state. Deliberately *not* persisted (unlike
 * `brew.store`'s saved ratios) - it should reset on reload, same as the
 * source design's in-memory component state.
 */
export const ratioSignal = signal<string>("16");
export const waterSignal = signal<string>("");
export const ozSignal = signal<string>("");
export const coffeeSignal = signal<number | null>(null);
export const tipOpenSignal = signal(false);

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
};

export const toggleTip = (): void => {
  tipOpenSignal.value = !tipOpenSignal.value;
};

/** Primes the calculator with a guide's default ratio - used by "Calculate this ratio" on the guide detail screen. */
export const primeCalculatorForRatio = (ratioDefault: number): void => {
  waterSignal.value = "";
  ozSignal.value = "";
  coffeeSignal.value = null;
  ratioSignal.value = String(ratioDefault);
};
