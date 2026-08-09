import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { StarRatingStyles } from "./star-rating.styles";

const STAR_POSITIONS = [1, 2, 3, 4, 5];

/**
 * # Star Rating
 * A compact 1-5 star indicator for a saved brew's tasting rating. Read-only
 * by default; pass `editable` to render tappable stars instead. Renders
 * nothing when read-only and unrated - there's nothing to show for a brew
 * that hasn't been rated yet.
 * ## Usage
 * ```html
 * <brew-star-rating
 *   editable
 *   .value="${rating}"
 *   @rating-change="${(e) => (rating = e.detail)}"
 * ></brew-star-rating>
 * ```
 * @element brew-star-rating
 * @fires rating-change - `CustomEvent<number>` fired (editable only) with the tapped star's 1-based position, or `0` when re-tapping the topmost active star toggles the rating off.
 */
export class StarRating extends LitElement {
  static styles = [StarRatingStyles];

  @property({ type: Number }) value = 0;
  @property({ type: Boolean }) editable = false;
  @property({ type: Number }) size = 20;

  private _onStarClick(position: number): void {
    const next = position === this.value ? 0 : position;
    this.dispatchEvent(
      new CustomEvent<number>("rating-change", { detail: next, bubbles: true, composed: true }),
    );
  }

  render(): HTMLTemplateResult {
    if (!this.editable && this.value === 0) return html``;

    return html`
      <span class="stars">
        ${STAR_POSITIONS.map((position) => {
          const filled = position <= this.value;
          return this.editable
            ? html`
                <button
                  type="button"
                  class="star ${filled ? "filled" : ""}"
                  @click="${() => this._onStarClick(position)}"
                >
                  <brew-icon name="star" size="${this.size}" ?filled="${filled}"></brew-icon>
                </button>
              `
            : html`
                <span class="star ${filled ? "filled" : ""}">
                  <brew-icon name="star" size="${this.size}" ?filled="${filled}"></brew-icon>
                </span>
              `;
        })}
      </span>
    `;
  }
}
