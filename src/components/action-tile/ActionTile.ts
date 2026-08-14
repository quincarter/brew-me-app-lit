import { type HTMLTemplateResult, html, LitElement, nothing, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { ActionTileStyles } from "./action-tile.styles";

export type ActionTileTone = "primary" | "secondary" | "tertiary";

/**
 * # Action Tile
 * A large tappable tonal card used for the three primary Home-screen actions
 * (Calculate, Saved Brews, Timer).
 * @element brew-action-tile
 */
export class ActionTile extends LitElement {
  static styles = [ActionTileStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: String }) tone: ActionTileTone = "primary";
  @property({ type: String }) href = "";
  @property({ type: String }) svg: SVGTemplateResult | null = null;

  render(): HTMLTemplateResult {
    return html`
      <a class="tile ${this.tone}" href="${this.href}">
        ${this.icon ? html`<brew-icon name="${this.icon}"></brew-icon>` : nothing}
        ${this.svg && !this.icon ? html`<brew-icon .svg="${this.svg}"></brew-icon>` : nothing}
        <span class="label">${this.label}</span>
      </a>
    `;
  }
}
