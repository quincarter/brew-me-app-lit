import { type HTMLTemplateResult, html, LitElement, nothing, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { IconButtonStyles } from "./icon-button.styles";

export type IconButtonVariant = "standard" | "filled" | "fab";

/**
 * # Icon Button
 * A round, icon-only button. Renders as an `<a>` when `href` is set so the
 * app router's global click handling can intercept navigation.
 * @element brew-icon-button
 * @fires icon-click - Fired when activated (only when no `href` is set).
 */
export class IconButton extends LitElement {
  static styles = [IconButtonStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) variant: IconButtonVariant = "standard";
  @property({ type: String }) href = "";
  /** Named `ariaLabelText` (not `ariaLabel`) to avoid clashing with the built-in `ARIAMixin.ariaLabel` on `HTMLElement`. */
  @property({ type: String, attribute: "aria-label" }) ariaLabelText = "";
  @property({ type: Number }) size = 24;
  /** A custom Lit SVG icon (from `src/shared/icons/`) - takes precedence over `icon` when set. */
  @property({ type: Object }) svgIcon: SVGTemplateResult | null = null;

  private _onClick = (): void => {
    if (this.href) return;
    this.dispatchEvent(new CustomEvent("icon-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    const inner = html`<brew-icon
      name="${this.icon}"
      size="${this.size}"
      .svg="${this.svgIcon}"
    ></brew-icon>`;
    return this.href
      ? html`<a
          class="btn ${this.variant}"
          href="${this.href}"
          aria-label="${this.ariaLabelText || nothing}"
          >${inner}</a
        >`
      : html`
          <button
            class="btn ${this.variant}"
            type="button"
            aria-label="${this.ariaLabelText || nothing}"
            @click="${this._onClick}"
          >
            ${inner}
          </button>
        `;
  }
}
