import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import { RatioSummaryStyles } from "./ratio-summary.styles";

/**
 * # Ratio Summary
 * A big ratio hero ("1:16" + "Coffee to water ratio" label) followed by a
 * row of coffee/water/cup-size stat tiles - purely presentational, takes
 * a brew's numbers as props. Shared by `saved-detail-page` (the read-only
 * view of a saved brew) and `brew-post-save-sheet` (the confirmation shown
 * right after saving), so both render this block identically.
 * @element brew-ratio-summary
 */
export class RatioSummary extends LitElement {
  static styles = [RatioSummaryStyles];

  @property({ type: Number }) ratio = 0;
  @property({ type: Number }) coffee = 0;
  @property({ type: Number }) water = 0;
  @property({ type: Number }) oz = 0;

  render(): HTMLTemplateResult {
    return html`
      <div class="ratio-hero">
        <div class="ratio-value">${formatRatio(this.ratio)}</div>
        <div class="ratio-label">Coffee to water ratio</div>
      </div>

      <div class="stat-row">
        <div class="stat">
          <div class="stat-value">${this.coffee}g</div>
          <div class="stat-label">coffee</div>
        </div>
        <div class="stat">
          <div class="stat-value">${this.water}g</div>
          <div class="stat-label">water</div>
        </div>
        <div class="stat">
          <div class="stat-value">${this.oz}oz</div>
          <div class="stat-label">cup size</div>
        </div>
      </div>
    `;
  }
}
