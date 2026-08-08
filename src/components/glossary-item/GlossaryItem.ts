import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { GlossaryItemStyles } from "./glossary-item.styles";

/**
 * # Glossary Item
 * A small static card pairing a piece of brewing terminology or a tool name
 * with a plain-language definition. Purely presentational - no interaction.
 *
 * ## Usage
 * ```html
 * <brew-glossary-item
 *   term="Tamping"
 *   definition="Pressing the dose into a flat, even puck."
 * ></brew-glossary-item>
 * ```
 * @element brew-glossary-item
 */
export class GlossaryItem extends LitElement {
  static styles = [GlossaryItemStyles];

  @property({ type: String }) term = "";
  @property({ type: String }) definition = "";

  render(): HTMLTemplateResult {
    return html`
      <div class="card">
        <span class="term">${this.term}</span>
        <span class="definition">${this.definition}</span>
      </div>
    `;
  }
}
