import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import "../avatar/brew-avatar";
import "../icon/brew-icon";
import { ListRowStyles } from "./list-row.styles";

/**
 * # List Row
 * A tappable row with a leading avatar or icon, a headline, optional
 * supporting text, and a trailing chevron. Renders as an `<a>` so the app
 * router can intercept navigation. Used for saved brews, the brewing tools
 * list, and the brew method guide list.
 * ## Usage
 * ```html
 * <brew-list-row
 *   headline="V60 · 16:1"
 *   supporting="30g coffee · 480g water · 16.2oz"
 *   leading-initial="V"
 *   href="/saved/1"
 * ></brew-list-row>
 * ```
 * @element brew-list-row
 */
export class ListRow extends LitElement {
  static styles = [ListRowStyles];

  @property({ type: String }) headline = "";
  @property({ type: String }) supporting = "";
  @property({ type: String, attribute: "leading-icon" }) leadingIcon = "";
  @property({ type: String, attribute: "leading-initial" }) leadingInitial = "";
  @property({ type: String, attribute: "leading-bg" }) leadingBg =
    "var(--brew-color-secondary-container)";
  @property({ type: String, attribute: "leading-fg" }) leadingFg =
    "var(--brew-color-on-secondary-container)";
  @property({ type: String }) href = "";

  private _renderLeading() {
    if (this.leadingInitial) {
      return html`<brew-avatar
        initial="${this.leadingInitial}"
        background="${this.leadingBg}"
        foreground="${this.leadingFg}"
        size="44"
      ></brew-avatar>`;
    }
    if (this.leadingIcon) {
      return html`
        <span class="icon-circle" style="background:${this.leadingBg};color:${this.leadingFg}">
          <brew-icon name="${this.leadingIcon}"></brew-icon>
        </span>
      `;
    }
    return nothing;
  }

  render(): HTMLTemplateResult {
    return html`
      <a class="row" href="${this.href}">
        ${this._renderLeading()}
        <span class="text">
          <span class="headline">${this.headline}</span>
          ${this.supporting ? html`<span class="supporting">${this.supporting}</span>` : nothing}
        </span>
        <brew-icon name="chevron_right" class="chevron"></brew-icon>
      </a>
    `;
  }
}
