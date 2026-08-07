import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { ActionTileStyles } from "./action-tile.styles";

export type ActionTileTone = "primary" | "secondary" | "tertiary";

/**
 * # Action Tile
 * A large tappable tonal card used for the three primary Home-screen actions
 * (Calculate, Saved Ratios, Timer).
 * @element brew-action-tile
 */
export class ActionTile extends LitElement {
  static styles = [ActionTileStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: String }) tone: ActionTileTone = "primary";
  @property({ type: String }) href = "";

  render(): HTMLTemplateResult {
    return html`
      <a class="tile ${this.tone}" href="${this.href}">
        <brew-icon name="${this.icon}"></brew-icon>
        <span class="label">${this.label}</span>
      </a>
    `;
  }
}
