import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import {
  cancelSaveDialog,
  confirmSave,
  pendingBrewIconSignal,
  pendingBrewNameSignal,
  pendingBrewTypeSignal,
  saveDialogOpenSignal,
  selectPendingBrewIcon,
  selectPendingBrewType,
  setPendingBrewName,
  shareAfterSaveSignal,
} from "../../shared/stores/save-dialog.store";
import {
  BREW_ICON_MAP,
  BREW_ICON_OPTIONS,
  normalizeBrewIconKey,
} from "../../shared/utilities/brew-icon.utility";
import type { ShareOutcome } from "../../shared/utilities/share.utility";
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
 * @fires brew-share-outcome - `CustomEvent<ShareOutcome>` fired after a "save & share" confirm resolves.
 */
export class SaveSheet extends SignalWatcher(LitElement) {
  static styles = [SaveSheetStyles];

  private _onTypeAdd = (event: CustomEvent<string>): void => {
    const added = addCustomBrewType(event.detail);
    if (added) selectPendingBrewType(added);
  };

  private _onConfirm = async (): Promise<void> => {
    const outcome = await confirmSave();
    if (outcome) {
      this.dispatchEvent(
        new CustomEvent<ShareOutcome>("brew-share-outcome", {
          detail: outcome,
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  render(): HTMLTemplateResult {
    if (!saveDialogOpenSignal.value) return html``;

    const pending = pendingBrewTypeSignal.value;
    const willShare = shareAfterSaveSignal.value;

    return html`
      <div class="scrim">
        <div class="sheet">
          <div class="title">${willShare ? "Name this brew to share it" : "Name this brew"}</div>
          <brew-text-field
            label="Brew name"
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
              >${willShare ? "Save & Share" : "Save"}</brew-button
            >
          </div>
        </div>
      </div>
    `;
  }
}
