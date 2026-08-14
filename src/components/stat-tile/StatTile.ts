import {
  type HTMLTemplateResult,
  html,
  LitElement,
  nothing,
  SVGTemplateResult,
} from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { StatTileStyles } from "./stat-tile.styles";

/**
 * # Stat Tile
 * A small surface card showing an icon, a big value, and a label - used for
 * the "saved brews" / "day streak" stats on Home and More.
 * @element brew-stat-tile
 */
export class StatTile extends LitElement {
  static styles = [StatTileStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) value = "";
  @property({ type: String }) label = "";
  @property({ type: String }) svg: SVGTemplateResult | null = null;

  render(): HTMLTemplateResult {
    return html`
      <div class="tile">
        ${this.icon
          ? html` <brew-icon name="${this.icon}" size="20"></brew-icon>`
          : nothing}
        ${this.svg && !this.icon
          ? html` <brew-icon .svg="${this.svg}" size="20"></brew-icon>`
          : nothing}
        <div class="value">${this.value}</div>
        <div class="label">${this.label}</div>
      </div>
    `;
  }
}
