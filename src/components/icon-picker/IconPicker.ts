import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { BREW_ICON_MAP, type IBrewIconOption } from "../../shared/utilities/brew-icon.utility";
import { IconPickerStyles } from "./icon-picker.styles";

/**
 * # Icon Picker
 * A grid of selectable circular icon buttons, used by the Save sheet to let
 * a custom brew type (one with no automatic icon match) pick a stock icon
 * for itself.
 * ## Usage
 * ```html
 * <brew-icon-picker
 *   .options="${BREW_ICON_OPTIONS}"
 *   selected="${pendingBrewIconSignal.value}"
 *   @icon-select="${(e) => selectPendingBrewIcon(e.detail)}"
 * ></brew-icon-picker>
 * ```
 * @element brew-icon-picker
 * @fires icon-select - `CustomEvent<string>` fired with the tapped option's `key`.
 */
export class IconPicker extends LitElement {
  static styles = [IconPickerStyles];

  @property({ type: Array }) options: IBrewIconOption[] = [];
  @property({ type: String }) selected = "";

  private _selectIcon(key: string): void {
    this.dispatchEvent(
      new CustomEvent<string>("icon-select", { detail: key, bubbles: true, composed: true }),
    );
  }

  render(): HTMLTemplateResult {
    return html`
      <div class="grid">
        ${this.options.map((option) => {
          const isSelected = option.key === this.selected;
          return html`
            <button
              class="icon-option ${isSelected ? "selected" : ""}"
              type="button"
              aria-pressed="${isSelected}"
              @click="${() => this._selectIcon(option.key)}"
            >
              <span class="icon">${BREW_ICON_MAP[option.key]}</span>
              <span class="label">${option.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }
}
