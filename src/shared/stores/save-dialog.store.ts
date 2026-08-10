import { signal } from "@lit-labs/preact-signals";
import type { ISaveConfirmResult, SaveDialogIntent } from "../interfaces/save-dialog.interface";
import { shareBrew } from "../utilities/share.utility";
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
export const saveIntentSignal = signal<SaveDialogIntent>("save");

export const setPendingBrewName = (value: string): void => {
  pendingBrewNameSignal.value = value;
};

export const openSaveDialog = (options?: { intent?: SaveDialogIntent }): void => {
  pendingBrewTypeSignal.value = null;
  pendingBrewNameSignal.value = "";
  pendingBrewIconSignal.value = "";
  saveIntentSignal.value = options?.intent ?? "save";
  saveDialogOpenSignal.value = true;
};

export const cancelSaveDialog = (): void => {
  saveDialogOpenSignal.value = false;
  saveIntentSignal.value = "save";
};

export const selectPendingBrewType = (brewType: string): void => {
  pendingBrewTypeSignal.value = brewType;
  pendingBrewIconSignal.value = "";
};

export const selectPendingBrewIcon = (icon: string): void => {
  pendingBrewIconSignal.value = icon;
};

export const confirmSave = async (): Promise<ISaveConfirmResult | null> => {
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

  const intent = saveIntentSignal.value;
  saveDialogOpenSignal.value = false;
  saveIntentSignal.value = "save";
  pendingBrewIconSignal.value = "";
  /**
   * Skipped for "guided-timer": resetting here would schedule a re-render of
   * the still-mounted, SignalWatcher-driven Calculator (blank fields,
   * disabled buttons) before the router's dynamic import for /timer
   * resolves - a visible flash on a cold navigation. "save" and "share"
   * both stay on this screen, so resetting is correct for them.
   */
  if (intent !== "guided-timer") resetCalculator();

  const shareOutcome = intent === "share" ? await shareBrew(savedBrew) : null;

  return { savedBrew, intent, shareOutcome };
};
