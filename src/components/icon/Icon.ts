import { type HTMLTemplateResult, html, LitElement } from "lit";
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

  render(): HTMLTemplateResult {
    return html`<span
      class="material-symbols-outlined"
      style="font-size:${this.size}px; font-variation-settings: 'FILL' ${this.filled ? 1 : 0}"
      >${this.name}</span
    >`;
  }
}
