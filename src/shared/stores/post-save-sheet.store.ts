import { signal } from "@lit-labs/preact-signals";
import type { ISavedBrew } from "../interfaces/brew.interface";

export const postSaveSheetOpenSignal = signal(false);
export const postSaveSheetBrewSignal = signal<ISavedBrew | null>(null);
/** True when the sheet was opened from that same brew's own detail screen (currently only "Brew again" on Saved Ratio Detail) - "Go to brew detail" would be a no-op there, so the sheet swaps it for "Edit before brewing" instead. */
export const postSaveSheetAlreadyOnDetailSignal = signal(false);
/** Set by the sheet's "Edit before brewing" action - the brew id whose detail screen should auto-enter edit mode on its next render. Consumed (cleared) by `saved-detail-page.ts`. */
export const editBeforeBrewingIdSignal = signal<number | null>(null);

export const openPostSaveSheet = (
  brew: ISavedBrew,
  options?: { alreadyOnDetail?: boolean },
): void => {
  postSaveSheetBrewSignal.value = brew;
  postSaveSheetAlreadyOnDetailSignal.value = options?.alreadyOnDetail ?? false;
  postSaveSheetOpenSignal.value = true;
};

export const closePostSaveSheet = (): void => {
  postSaveSheetOpenSignal.value = false;
};

/** Requests that the given brew's detail screen enter edit mode, and dismisses the sheet - used by "Edit before brewing" instead of navigating, since it's already the screen being shown. */
export const requestEditBeforeBrewing = (brewId: number): void => {
  editBeforeBrewingIdSignal.value = brewId;
  closePostSaveSheet();
};
