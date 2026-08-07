import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { ButtonStyles } from "./button.styles";

export type ButtonVariant = "filled" | "outlined" | "text";

/**
 * # Button
 * A Material-style button with filled, outlined, and text variants. Renders
 * as an `<a>` when `href` is set so the app router's global click handling
 * can intercept navigation.
 * ## Usage
 * ```html
 * <brew-button variant="filled">Save ratio</brew-button>
 * <brew-button variant="filled" href="/calculate">Go to Calculator</brew-button>
 * ```
 * @element brew-button
 * @slot - Button label content.
 * @fires button-click - Fired on activation when not disabled and no `href` is set.
 */
export class Button extends LitElement {
  static styles = [ButtonStyles];

  @property({ type: String }) variant: ButtonVariant = "filled";
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, attribute: "full-width" }) fullWidth = false;
  @property({ type: String }) href = "";

  private _onClick = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    if (!this.href) {
      this.dispatchEvent(new CustomEvent("button-click", { bubbles: true, composed: true }));
    }
  };

  render(): HTMLTemplateResult {
    const classes = `btn ${this.variant} ${this.fullWidth ? "full-width" : ""}`;
    return this.href
      ? html`<a class="${classes}" href="${this.href}" @click="${this._onClick}"><slot></slot></a>`
      : html`
          <button
            class="${classes}"
            ?disabled="${this.disabled}"
            type="button"
            @click="${this._onClick}"
          >
            <slot></slot>
          </button>
        `;
  }
}
