import { type HTMLTemplateResult, html, LitElement, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { IconStyles } from "./icon.styles";

/**
 * # Icon
 * Renders a Material Symbols (outlined) glyph by name.
 * ## Usage
 * ```html
 * <brew-icon name="calculate"></brew-icon>
 * ```
 * @element brew-icon
 */
export class Icon extends LitElement {
  static styles = [IconStyles];

  /**
   * The Material Symbols icon name, e.g. "calculate", "bookmark", "timer".
   * @attr name
   */
  @property({ type: String })
  name = "";

  /** Icon size in pixels. @attr size */
  @property({ type: Number })
  size = 24;

  /** Renders the filled variant via the Material Symbols variable-font FILL axis. @attr filled */
  @property({ type: Boolean })
  filled = false;

  /** A custom Lit SVG icon (from `src/shared/icons/`) - takes precedence over `name` when set. */
  @property({ type: Object })
  svg: SVGTemplateResult | null = null;

  render(): HTMLTemplateResult {
    if (this.svg) {
      return html`<span
        class="icon-svg"
        aria-hidden="true"
        style="width:${this.size}px;height:${this.size}px"
        >${this.svg}</span
      >`;
    }

    return html`<span
      class="material-symbols-outlined"
      aria-hidden="true"
      style="font-size:${this.size}px; font-variation-settings: 'FILL' ${this.filled ? 1 : 0}"
      >${this.name}</span
    >`;
  }
}
