import { signal } from "@lit-labs/preact-signals";
import type { ISaveConfirmResult, SaveDialogIntent } from "../interfaces/save-dialog.interface";
import { shareBrew } from "../utilities/share.utility";
import {
  QUICK_CALCULATOR,
  brewStepsSignal,
  loadedRecipeSourceSignal,
  selectedBrewTypeSignal,
} from "./brew-steps.store";
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
  const selectedType = selectedBrewTypeSignal.value;
  // Prefill from the Calculator's own brew-type chooser when it picked a
  // real method - the quick-calculator sentinel and "not answered yet" both
  // leave the Save sheet's type picker unselected, same as before this feature.
  pendingBrewTypeSignal.value =
    selectedType && selectedType !== QUICK_CALCULATOR ? selectedType : null;
  pendingBrewNameSignal.value = "";
  pendingBrewIconSignal.value = "";
  saveIntentSignal.value = options?.intent ?? "save";
  if (saveDialogOpenSignal.value) {
    saveDialogOpenSignal.value = false;
  }
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

  /**
   * `brewStepsSignal`/`loadedRecipeSourceSignal` describe the Calculator's
   * own brew-type selection, not the Save sheet's - the two are independent
   * signals (see `selectPendingBrewType` above). Only carry them through
   * when the person didn't change the type in the Save sheet; otherwise
   * they'd desync from the type actually being saved (e.g. AeroPress steps
   * saved under a "Kalita Wave" brewType).
   */
  const stepsMatchSavedType = brewType === selectedBrewTypeSignal.value;

  const name = pendingBrewNameSignal.value.trim();
  const savedBrew = addSavedBrew({
    brewType,
    name: name || undefined,
    icon: pendingBrewIconSignal.value || undefined,
    ratio: Number.parseFloat(ratioSignal.value),
    water: Number.parseFloat(waterSignal.value),
    coffee,
    oz: Number.parseFloat(ozSignal.value),
    brewSteps: stepsMatchSavedType ? (brewStepsSignal.value ?? undefined) : undefined,
    recipeSource: stepsMatchSavedType ? (loadedRecipeSourceSignal.value ?? undefined) : undefined,
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
