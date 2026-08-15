import { type HTMLTemplateResult, html, LitElement, nothing, type SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../avatar/brew-avatar";
import "../icon/brew-icon";
import "../icon-button/brew-icon-button";
import "../star-rating/brew-star-rating";
import { ListRowStyles } from "./list-row.styles";
import { REPLAY_ICON } from "../../shared/icons/replay.svg";
import { CHEVRON_RIGHT_ICON_SVG } from "../../shared/icons/chevron-right.svg";
import { MENU_BOOK_ICON_SVG } from "../../shared/icons/menu-book.svg";

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
 * @fires trailing-action-click - Fired when `trailingActionIcon` is set and its trailing icon button is activated. The row's own navigation is suppressed for this tap.
 */
export class ListRow extends LitElement {
  static styles = [ListRowStyles];

  @property({ type: String }) headline = "";
  @property({ type: String }) supporting = "";
  @property({ attribute: "leading-icon" }) leadingIcon: string | SVGTemplateResult = "";
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
  /**
   * A custom trailing quick action (before the chevron) that fires
   * `trailing-action-click` instead of navigating - a more generic sibling
   * to `replayable` for rows whose row-tap has nowhere to navigate but
   * still need one deliberate, distinct action (e.g. "Brew now" on a
   * curated-recipe browse list). Set alongside `trailingActionLabel`; takes
   * priority over `replayable` when both are set.
   */
  @property({ type: Object, attribute: false }) trailingActionIcon: SVGTemplateResult | null = null;
  @property({ type: String, attribute: "trailing-action-label" }) trailingActionLabel = "";
  /**
   * Shows a small, subtle book icon badge next to the headline when the row
   * represents a brew that carries `recipeSource` provenance (loaded from a
   * curated recipe) - a lightweight "you can see where this came from" hint
   * on list screens, distinct from the full "Pulled from"/"Modified from"
   * banner (`renderRecipeProvenanceBanner`) shown on the detail screen.
   * Icon-only, so it carries its own `aria-label`.
   */
  @property({ type: Boolean, attribute: "has-recipe-source" }) hasRecipeSource = false;

  private _onReplayClick = (event: Event): void => {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("replay-click", { bubbles: true, composed: true }));
  };

  private _onTrailingActionClick = (event: Event): void => {
    event.stopPropagation();
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("trailing-action-click", { bubbles: true, composed: true }));
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
          ${
            typeof this.leadingIcon === "string"
              ? html`<brew-icon name="${this.leadingIcon}"></brew-icon>`
              : html`<brew-icon .svg="${this.leadingIcon}"></brew-icon>`
          }
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
          <span class="headline-row">
            <span class="headline">${this.headline}</span>
            ${
              this.hasRecipeSource
                ? html`<span
                    class="recipe-source-badge"
                    role="img"
                    aria-label="Loaded from a recipe"
                    title="Loaded from a recipe"
                  >
                    <brew-icon .svg="${MENU_BOOK_ICON_SVG}" size="14"></brew-icon>
                  </span>`
                : nothing
            }
          </span>
          ${this.supporting ? html`<span class="supporting">${this.supporting}</span>` : nothing}
          ${
            this.isSavedBrew
              ? html`<brew-star-rating value="${this.rating}" size="14"></brew-star-rating>`
              : nothing
          }
        </span>
        ${
          this.trailingActionIcon
            ? html`<brew-icon-button
                .svgIcon="${this.trailingActionIcon}"
                aria-label="${this.trailingActionLabel}"
                style="--icon-button-size: 36px; --icon-button-color: var(--brew-color-primary);
                  --icon-button-bg: var(--brew-color-surface-container-high)"
                @click="${this._onTrailingActionClick}"
              ></brew-icon-button>`
            : this.replayable
              ? html`<brew-icon-button
                  .svgIcon="${REPLAY_ICON}"
                  aria-label="Brew again"
                  style="--icon-button-size: 36px; --icon-button-color: var(--brew-color-primary);
                    --icon-button-bg: var(--brew-color-surface-container-high)"
                  @click="${this._onReplayClick}"
                ></brew-icon-button>`
              : nothing
        }
        <brew-icon .svg="${CHEVRON_RIGHT_ICON_SVG}" class="chevron"></brew-icon>
      </a>
    `;
  }
}
