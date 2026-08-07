import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import {
  cancelSaveDialog,
  confirmSave,
  pendingBrewTypeSignal,
  saveDialogOpenSignal,
  selectPendingBrewType,
} from "../../shared/stores/save-dialog.store";
import "../button/brew-button";
import "../type-picker/brew-type-picker";
import { SaveSheetStyles } from "./save-sheet.styles";

/**
 * # Save Sheet
 * The bottom-sheet dialog used on the Calculator screen to name and save a
 * brew ratio. Reads and drives `save-dialog.store` directly, since it's
 * tightly coupled to that flow (same as the source design).
 * @element brew-save-sheet
 */
export class SaveSheet extends SignalWatcher(LitElement) {
  static styles = [SaveSheetStyles];

  private _onTypeAdd = (event: CustomEvent<string>): void => {
    const added = addCustomBrewType(event.detail);
    if (added) selectPendingBrewType(added);
  };

  render(): HTMLTemplateResult {
    if (!saveDialogOpenSignal.value) return html``;

    const pending = pendingBrewTypeSignal.value;

    return html`
      <div class="scrim">
        <div class="sheet">
          <div class="title">Name this brew</div>
          <brew-type-picker
            .types="${allBrewTypesSignal.value}"
            selected="${pending ?? ""}"
            @type-select="${(e: CustomEvent<string>) => selectPendingBrewType(e.detail)}"
            @type-add="${this._onTypeAdd}"
          ></brew-type-picker>
          <div class="hint">Saved locally on this device — no account needed.</div>
          <div class="actions">
            <brew-button variant="text" @button-click="${cancelSaveDialog}">Cancel</brew-button>
            <brew-button variant="filled" ?disabled="${!pending}" @button-click="${confirmSave}"
              >Save</brew-button
            >
          </div>
        </div>
      </div>
    `;
  }
}
