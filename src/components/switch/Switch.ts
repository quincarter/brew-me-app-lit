import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { SwitchStyles } from "./switch.styles";

/**
 * # Switch
 * A Material-style on/off toggle track, used for boolean settings (e.g.
 * dark mode on the Settings screen).
 * ## Usage
 * ```html
 * <brew-switch ?checked="${isDark}" aria-label="Dark mode" @change="${(e) => setDarkTheme(e.detail)}"></brew-switch>
 * ```
 * @element brew-switch
 * @fires change - `CustomEvent<boolean>` fired with the new checked state on activation.
 */
export class Switch extends LitElement {
  static styles = [SwitchStyles];

  @property({ type: Boolean, reflect: true }) checked = false;
  /** Named `ariaLabelText` (not `ariaLabel`) to avoid clashing with the built-in `ARIAMixin.ariaLabel` on `HTMLElement`. */
  @property({ type: String, attribute: "aria-label" }) ariaLabelText = "";

  private _onClick = (): void => {
    this.dispatchEvent(
      new CustomEvent<boolean>("change", { detail: !this.checked, bubbles: true, composed: true }),
    );
  };

  render(): HTMLTemplateResult {
    return html`
      <button
        class="track ${this.checked ? "checked" : ""}"
        type="button"
        role="switch"
        aria-checked="${this.checked}"
        aria-label="${this.ariaLabelText || nothing}"
        @click="${this._onClick}"
      >
        <span class="thumb"></span>
      </button>
    `;
  }
}
