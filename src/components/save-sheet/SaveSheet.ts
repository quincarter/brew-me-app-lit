import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import {
  cancelSaveDialog,
  confirmSave,
  pendingBrewIconSignal,
  pendingBrewNameSignal,
  pendingBrewTypeSignal,
  saveDialogOpenSignal,
  saveIntentSignal,
  selectPendingBrewIcon,
  selectPendingBrewType,
  setPendingBrewName,
} from "../../shared/stores/save-dialog.store";
import {
  BREW_ICON_MAP,
  BREW_ICON_OPTIONS,
  normalizeBrewIconKey,
} from "../../shared/utilities/brew-icon.utility";
import type { ShareOutcome } from "../../shared/utilities/share.utility";
import "../bottom-sheet/brew-bottom-sheet";
import "../button/brew-button";
import "../icon-picker/brew-icon-picker";
import "../text-field/brew-text-field";
import "../type-picker/brew-type-picker";
import { SaveSheetStyles } from "./save-sheet.styles";

/**
 * # Save Sheet
 * The bottom-sheet dialog used on the Calculator screen to name and save a
 * brew ratio. Reads and drives `save-dialog.store` directly, since it's
 * tightly coupled to that flow (same as the source design).
 * @element brew-save-sheet
 * @fires brew-saved - `CustomEvent<ISavedBrew>` fired after a plain "save" confirm.
 * @fires brew-share-outcome - `CustomEvent<ShareOutcome>` fired after a "save & share" confirm resolves.
 * @fires brew-guided-timer-ready - `CustomEvent<ISavedBrew>` fired after a "save & start guided timer" confirm.
 */
export class SaveSheet extends SignalWatcher(LitElement) {
  static styles = [SaveSheetStyles];

  private _onTypeAdd = (event: CustomEvent<string>): void => {
    const added = addCustomBrewType(event.detail);
    if (added) selectPendingBrewType(added);
  };

  private _onConfirm = async (): Promise<void> => {
    const result = await confirmSave();
    if (!result) return;

    if (result.intent === "guided-timer") {
      this.dispatchEvent(
        new CustomEvent<ISavedBrew>("brew-guided-timer-ready", {
          detail: result.savedBrew,
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    if (result.shareOutcome) {
      this.dispatchEvent(
        new CustomEvent<ShareOutcome>("brew-share-outcome", {
          detail: result.shareOutcome,
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent<ISavedBrew>("brew-saved", {
        detail: result.savedBrew,
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): HTMLTemplateResult {
    const pending = pendingBrewTypeSignal.value;
    const intent = saveIntentSignal.value;
    const title =
      intent === "guided-timer"
        ? "Name this brew to start your guided brew"
        : intent === "share"
          ? "Name this brew to share it"
          : "Name this brew";
    const confirmLabel =
      intent === "guided-timer"
        ? "Save & Start Timer"
        : intent === "share"
          ? "Save & Share"
          : "Save";

    return html`
      <brew-bottom-sheet
        ?open="${saveDialogOpenSignal.value}"
        label="${title}"
        @sheet-scrim-click="${cancelSaveDialog}"
      >
        <div class="title">${title}</div>
        <brew-text-field
          label="Brew name"
          .placeholder="${pendingBrewNameSignal.value}"
          .value="${pendingBrewNameSignal.value}"
          @value-change="${(e: CustomEvent<string>) => setPendingBrewName(e.detail)}"
        ></brew-text-field>
        <div class="hint">Optional — falls back to the brew type below if left blank.</div>
        <brew-type-picker
          .types="${allBrewTypesSignal.value}"
          selected="${pending ?? ""}"
          @type-select="${(e: CustomEvent<string>) => selectPendingBrewType(e.detail)}"
          @type-add="${this._onTypeAdd}"
        ></brew-type-picker>
        ${
          pending && !BREW_ICON_MAP[normalizeBrewIconKey(pending)]
            ? html`
                <div class="field-label">Icon (optional)</div>
                <brew-icon-picker
                  .options="${BREW_ICON_OPTIONS}"
                  selected="${pendingBrewIconSignal.value}"
                  @icon-select="${(e: CustomEvent<string>) => selectPendingBrewIcon(e.detail)}"
                ></brew-icon-picker>
              `
            : null
        }
        <div class="hint">Saved locally on this device — no account needed.</div>
        <div class="actions">
          <brew-button variant="text" @button-click="${cancelSaveDialog}">Cancel</brew-button>
          <brew-button variant="filled" ?disabled="${!pending}" @button-click="${this._onConfirm}"
            >${confirmLabel}</brew-button
          >
        </div>
      </brew-bottom-sheet>
    `;
  }
}
