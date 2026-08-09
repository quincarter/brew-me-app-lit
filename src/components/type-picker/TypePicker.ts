import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import "../button/brew-button";
import "../chip/brew-chip";
import "../text-field/brew-text-field";
import { TypePickerStyles } from "./type-picker.styles";

/**
 * # Type Picker
 * A chip grid for choosing a brew type, with a built-in "+ Add brew type"
 * affordance for types that aren't in the stock list. Used by both the
 * post-creation Save sheet and the Saved Ratio Detail edit flow so adding a
 * custom type works identically in both places.
 *
 * Like `brew-ratio-form`, this is a *controlled* component: it doesn't own
 * the brew-type list or persist new types itself. The consumer passes in
 * the full list to render (typically `allBrewTypesSignal.value`, stock +
 * custom) and reacts to `type-select`/`type-add` to update its own
 * "selected" state and persist new types via `addCustomBrewType`.
 * ## Usage
 * ```html
 * <brew-type-picker
 *   .types="${allBrewTypesSignal.value}"
 *   selected="${pending}"
 *   @type-select="${(e) => selectPendingBrewType(e.detail)}"
 *   @type-add="${(e) => {
 *     const added = addCustomBrewType(e.detail);
 *     if (added) selectPendingBrewType(added);
 *   }}"
 * ></brew-type-picker>
 * ```
 * @element brew-type-picker
 * @fires type-select - `CustomEvent<string>` fired with the tapped type's name.
 * @fires type-add - `CustomEvent<string>` fired with the trimmed name once "Add" is confirmed.
 */
export class TypePicker extends LitElement {
  static styles = [TypePickerStyles];

  @property({ type: Array }) types: string[] = [];
  @property({ type: String }) selected = "";

  @state() private _adding = false;
  @state() private _draft = "";

  private _selectType(name: string): void {
    this.dispatchEvent(
      new CustomEvent<string>("type-select", { detail: name, bubbles: true, composed: true }),
    );
  }

  private _startAdding = (): void => {
    this._adding = true;
    this._draft = "";
  };

  private _cancelAdding = (): void => {
    this._adding = false;
    this._draft = "";
  };

  private _confirmAdding = (): void => {
    const trimmed = this._draft.trim();
    if (!trimmed) return;
    this.dispatchEvent(
      new CustomEvent<string>("type-add", { detail: trimmed, bubbles: true, composed: true }),
    );
    this._adding = false;
    this._draft = "";
  };

  render(): HTMLTemplateResult {
    return html`
      <div class="chips">
        ${this.types.map(
          (name) => html`
            <brew-chip
              label="${name}"
              ?selected="${name === this.selected}"
              @chip-click="${() => this._selectType(name)}"
            ></brew-chip>
          `,
        )}
        <brew-chip label="+ Add brew type" @chip-click="${this._startAdding}"></brew-chip>
      </div>

      ${
        this._adding
          ? html`
              <div class="add-row">
                <brew-text-field
                  label="New brew type"
                  .value="${this._draft}"
                  @value-change="${(e: CustomEvent<string>) => {
                    this._draft = e.detail;
                  }}"
                ></brew-text-field>
                <div class="add-actions">
                  <brew-button variant="text" @button-click="${this._cancelAdding}"
                    >Cancel</brew-button
                  >
                  <brew-button
                    variant="filled"
                    ?disabled="${!this._draft.trim()}"
                    @button-click="${this._confirmAdding}"
                    >Add</brew-button
                  >
                </div>
              </div>
            `
          : nothing
      }
    `;
  }
}
