import { signal } from "@lit-labs/preact-signals";
import { type ShareOutcome, shareBrew } from "../utilities/share.utility";
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
export const pendingBrewNameSignal = signal<string>("");
export const pendingBrewIconSignal = signal<string>("");
export const shareAfterSaveSignal = signal(false);

export const setPendingBrewName = (value: string): void => {
  pendingBrewNameSignal.value = value;
};

export const openSaveDialog = (options?: { shareAfterSave?: boolean }): void => {
  pendingBrewTypeSignal.value = null;
  pendingBrewNameSignal.value = "";
  pendingBrewIconSignal.value = "";
  shareAfterSaveSignal.value = options?.shareAfterSave ?? false;
  saveDialogOpenSignal.value = true;
};

export const cancelSaveDialog = (): void => {
  saveDialogOpenSignal.value = false;
  shareAfterSaveSignal.value = false;
};

export const selectPendingBrewType = (brewType: string): void => {
  pendingBrewTypeSignal.value = brewType;
  pendingBrewIconSignal.value = "";
};

export const selectPendingBrewIcon = (icon: string): void => {
  pendingBrewIconSignal.value = icon;
};

export const confirmSave = async (): Promise<ShareOutcome | null> => {
  const brewType = pendingBrewTypeSignal.value;
  const coffee = coffeeSignal.value;
  if (!brewType || coffee === null) return null;

  const name = pendingBrewNameSignal.value.trim();
  const savedBrew = addSavedBrew({
    brewType,
    name: name || undefined,
    icon: pendingBrewIconSignal.value || undefined,
    ratio: Number.parseFloat(ratioSignal.value),
    water: Number.parseFloat(waterSignal.value),
    coffee,
    oz: Number.parseFloat(ozSignal.value),
  });

  const shouldShare = shareAfterSaveSignal.value;
  saveDialogOpenSignal.value = false;
  shareAfterSaveSignal.value = false;
  pendingBrewIconSignal.value = "";
  resetCalculator();

  return shouldShare ? await shareBrew(savedBrew) : null;
};
