import { type HTMLTemplateResult, html, LitElement, nothing, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { ActionTileStyles } from "./action-tile.styles";

export type ActionTileTone = "primary" | "secondary" | "tertiary" | "neutral";

/**
 * # Action Tile
 * A large tappable tonal card used for the primary Home-screen actions
 * (Calculate, Saved Brews, Timer). Renders as a link when `href` is set;
 * omitting `href` renders it as a `<button>` that fires `tile-click`
 * instead of navigating (e.g. Home's "Connect devices" tile, which opens a
 * sheet rather than going anywhere).
 * @element brew-action-tile
 * @fires tile-click - Fired when activated with no `href` set.
 */
export class ActionTile extends LitElement {
  static styles = [ActionTileStyles];

  @property({ type: String }) icon = "";
  @property({ type: String }) label = "";
  @property({ type: String }) tone: ActionTileTone = "primary";
  @property({ type: String }) href = "";
  @property({ type: String }) svg: SVGTemplateResult | null = null;

  private _onClick = (): void => {
    if (this.href) return;
    this.dispatchEvent(new CustomEvent("tile-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    const inner = html`
      ${this.icon ? html`<brew-icon name="${this.icon}"></brew-icon>` : nothing}
      ${this.svg && !this.icon ? html`<brew-icon .svg="${this.svg}"></brew-icon>` : nothing}
      <span class="label">${this.label}</span>
    `;

    return this.href
      ? html`<a class="tile ${this.tone}" href="${this.href}">${inner}</a>`
      : html`<button type="button" class="tile ${this.tone}" @click="${this._onClick}">
          ${inner}
        </button>`;
  }
}
