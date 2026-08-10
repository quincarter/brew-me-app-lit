import { signal } from "@lit-labs/preact-signals";
import type { ISavedBrew } from "../interfaces/brew.interface";

export const postSaveSheetOpenSignal = signal(false);
export const postSaveSheetBrewSignal = signal<ISavedBrew | null>(null);

export const openPostSaveSheet = (brew: ISavedBrew): void => {
  postSaveSheetBrewSignal.value = brew;
  postSaveSheetOpenSignal.value = true;
};

export const closePostSaveSheet = (): void => {
  postSaveSheetOpenSignal.value = false;
};
