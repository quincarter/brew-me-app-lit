import { type HTMLTemplateResult, html, LitElement, nothing, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../avatar/brew-avatar";
import "../icon/brew-icon";
import "../icon-button/brew-icon-button";
import "../star-rating/brew-star-rating";
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
 *   headline="V60 · 1:16"
 *   supporting="30g coffee · 480g water · 16.2oz"
 *   leading-initial="V"
 *   href="/saved/1"
 *   replayable
 *   @replay-click="${() => brewAgain(brew)}"
 * ></brew-list-row>
 * ```
 * @element brew-list-row
 * @fires replay-click - Fired when `replayable` is set and its trailing replay icon button is activated. The row's own navigation is suppressed for this tap.
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
  @property({ type: Object }) avatarIcon: SVGTemplateResult | null = null;
  @property({ type: Number }) rating = 0;
  /** Shows a trailing "replay" quick action (before the chevron) that fires `replay-click` instead of navigating - used for "Brew again". */
  @property({ type: Boolean }) replayable = false;
  @property({ type: Boolean, attribute: "is-saved-brew" }) isSavedBrew = false;

  private _onReplayClick = (event: Event): void => {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("replay-click", { bubbles: true, composed: true }));
  };

  private _renderLeading() {
    if (this.leadingInitial) {
      return html`<brew-avatar
        initial="${this.leadingInitial}"
        background="${this.leadingBg}"
        foreground="${this.leadingFg}"
        size="44"
        .icon="${this.avatarIcon}"
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
          ${
            this.isSavedBrew
              ? html`<brew-star-rating value="${this.rating}" size="14"></brew-star-rating>`
              : nothing
          }
        </span>
        ${
          this.replayable
            ? html`<brew-icon-button
                icon="replay"
                aria-label="Brew again"
                style="--icon-button-size: 36px; --icon-button-color: var(--brew-color-primary)"
                @click="${this._onReplayClick}"
              ></brew-icon-button>`
            : nothing
        }
        <brew-icon name="chevron_right" class="chevron"></brew-icon>
      </a>
    `;
  }
}
