import { signal } from "@lit-labs/preact-signals";
import { addSavedBrew } from "./brew.store";
import {
  coffeeSignal,
  ozSignal,
  ratioSignal,
  resetCalculator,
  waterSignal,
} from "./calculator.store";

export const saveDialogOpenSignal = signal(false);
export const pendingBrewTypeSignal = signal<string | null>(null);

export const openSaveDialog = (): void => {
  pendingBrewTypeSignal.value = null;
  saveDialogOpenSignal.value = true;
};

export const cancelSaveDialog = (): void => {
  saveDialogOpenSignal.value = false;
};

export const selectPendingBrewType = (brewType: string): void => {
  pendingBrewTypeSignal.value = brewType;
};

export const confirmSave = (): void => {
  const brewType = pendingBrewTypeSignal.value;
  const coffee = coffeeSignal.value;
  if (!brewType || coffee === null) return;

  addSavedBrew({
    brewType,
    ratio: Number.parseFloat(ratioSignal.value),
    water: Number.parseFloat(waterSignal.value),
    coffee,
    oz: Number.parseFloat(ozSignal.value),
  });

  saveDialogOpenSignal.value = false;
  resetCalculator();
};
