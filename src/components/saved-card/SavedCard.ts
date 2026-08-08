import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../avatar/brew-avatar";
import { SavedCardStyles } from "./saved-card.styles";

/**
 * # Saved Card
 * A compact card summarizing one saved brew - avatar, brew type, ratio, and
 * quantities - used in horizontally-scrolling rows of saved brews. Shared
 * by the Home screen's "Recent brews" row and a brew guide's "Recent
 * {type} Brews" row so both look and behave identically.
 * ## Usage
 * ```html
 * <brew-saved-card
 *   href="/saved/${brew.id}"
 *   brew-type="${brew.brewType}"
 *   ratio="${brew.ratio}"
 *   coffee="${brew.coffee}"
 *   water="${brew.water}"
 *   oz="${brew.oz}"
 *   avatar-initial="${getInitial(brew.brewType)}"
 *   avatar-bg="${colors.background}"
 *   avatar-fg="${colors.foreground}"
 * ></brew-saved-card>
 * ```
 * @element brew-saved-card
 */
export class SavedCard extends LitElement {
  static styles = [SavedCardStyles];

  @property({ type: String }) href = "";
  @property({ type: String, attribute: "brew-type" }) brewType = "";
  @property({ type: Number }) ratio = 0;
  @property({ type: Number }) coffee = 0;
  @property({ type: Number }) water = 0;
  @property({ type: Number }) oz = 0;
  @property({ type: String, attribute: "avatar-initial" }) avatarInitial = "";
  @property({ type: String, attribute: "avatar-bg" }) avatarBg =
    "var(--brew-color-secondary-container)";
  @property({ type: String, attribute: "avatar-fg" }) avatarFg =
    "var(--brew-color-on-secondary-container)";

  render(): HTMLTemplateResult {
    return html`
      <a class="card" href="${this.href}">
        <brew-avatar
          initial="${this.avatarInitial}"
          background="${this.avatarBg}"
          foreground="${this.avatarFg}"
          size="32"
        ></brew-avatar>
        <span class="type">${this.brewType}</span>
        <span class="stats">
          <span class="ratio">${this.ratio}:1 · ${this.coffee}g coffee</span>
          <span class="detail">${this.water}g water · ${this.oz}oz</span>
        </span>
      </a>
    `;
  }
}
