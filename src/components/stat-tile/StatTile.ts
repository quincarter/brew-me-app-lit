import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { StatTileStyles } from "./stat-tile.styles";

/**
 * # Stat Tile
 * A small surface card showing an icon, a big value, and a label - used for
 * the "saved ratios" / "day streak" stats on Home and More.
 * @element brew-stat-tile
 */
export class StatTile extends LitElement {
  static styles = [StatTileStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) value = "";
  @property({ type: String }) label = "";

  render(): HTMLTemplateResult {
    return html`
      <div class="tile">
        <brew-icon name="${this.icon}" size="20"></brew-icon>
        <div class="value">${this.value}</div>
        <div class="label">${this.label}</div>
      </div>
    `;
  }
}
