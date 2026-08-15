import { signal } from "@lit-labs/preact-signals";
import { round1 } from "../utilities/ratio.utility";

/**
 * Ephemeral espresso calculator state - dose-in/ratio/dose-out, mirroring
 * `calculator.store.ts`'s pour-over ratio/water/oz linking but for
 * espresso's dose-in/dose-out model instead. Deliberately not persisted -
 * resets on reload, same as the rest of the calculator session.
 */
export const espressoDoseInSignal = signal<number>(18);
export const espressoRatioSignal = signal<number>(2);
export const espressoDoseOutSignal = signal<number>(36);

/** Editing dose-in recomputes dose-out from the current ratio, holding ratio fixed. */
export const setEspressoDoseIn = (raw: string): void => {
  const doseIn = Number.parseFloat(raw);
  if (Number.isNaN(doseIn) || doseIn < 0) return;
  espressoDoseInSignal.value = doseIn;
  espressoDoseOutSignal.value = Math.round(doseIn * espressoRatioSignal.value);
};

/** Editing ratio recomputes dose-out from the current dose-in, holding dose-in fixed. */
export const setEspressoRatio = (raw: string): void => {
  const ratio = Number.parseFloat(raw);
  if (Number.isNaN(ratio) || ratio < 0) return;
  espressoRatioSignal.value = ratio;
  espressoDoseOutSignal.value = Math.round(espressoDoseInSignal.value * ratio);
};

/** Editing dose-out recomputes the ratio from the current dose-in, holding dose-in fixed. */
export const setEspressoDoseOut = (raw: string): void => {
  const doseOut = Number.parseFloat(raw);
  if (Number.isNaN(doseOut) || doseOut < 0) return;
  espressoDoseOutSignal.value = doseOut;
  const doseIn = espressoDoseInSignal.value;
  if (doseIn > 0) espressoRatioSignal.value = round1(doseOut / doseIn);
};

export const resetEspressoCalculator = (): void => {
  espressoDoseInSignal.value = 18;
  espressoRatioSignal.value = 2;
  espressoDoseOutSignal.value = 36;
};
