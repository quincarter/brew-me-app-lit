import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { ChipStyles } from "./chip.styles";
import { CHECK_ICON_SVG } from "../../shared/icons/check.svg";

/**
 * # Chip
 * A selectable filter chip, used to pick a brew type in the Save sheet.
 * @element brew-chip
 * @fires chip-click - Fired when the chip is activated.
 */
export class Chip extends LitElement {
  static styles = [ChipStyles];

  @property({ type: String }) label = "";
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private _onClick = (): void => {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent("chip-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    return html`
      <button
        class="chip ${this.selected ? "selected" : ""}"
        type="button"
        ?disabled="${this.disabled}"
        @click="${this._onClick}"
      >
        ${this.selected ? html`<brew-icon .svg="${CHECK_ICON_SVG}" size="16"></brew-icon>` : nothing}
        <span>${this.label}</span>
      </button>
    `;
  }
}
