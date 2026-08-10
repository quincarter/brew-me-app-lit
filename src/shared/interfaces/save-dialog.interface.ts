import type { ISavedBrew } from "./brew.interface";
import type { ShareOutcome } from "../utilities/share.utility";

/**
 * What the Calculator's "Save" flow was invoked to do - drives
 * `save-dialog.store.ts`'s post-confirm branching (plain save, save &
 * share, or save & jump to the guided timer).
 */
export type SaveDialogIntent = "save" | "share" | "guided-timer";

export interface ISaveConfirmResult {
  savedBrew: ISavedBrew;
  intent: SaveDialogIntent;
  shareOutcome: ShareOutcome | null;
}
