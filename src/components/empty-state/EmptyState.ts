import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import "../button/brew-button";
import { EmptyStateStyles } from "./empty-state.styles";

/**
 * # Empty State
 * The shared "nothing here yet" card - the sleepy `tired-guy` illustration,
 * a cheeky message, and an optional CTA button. Used wherever a screen has
 * no data yet (home's recent Brews, the Saved Brews list) so the wording
 * and imaging stay identical instead of drifting per-screen.
 * @element brew-empty-state
 */
export class EmptyState extends LitElement {
  static styles = [EmptyStateStyles];

  @property({ type: String }) image = "/tired-guy.webp";
  @property({ type: String, attribute: "message" }) message =
    "No coffee brews yet! Head over to Calculate to add some!";
  @property({ type: String, attribute: "cta-label" }) ctaLabel = "Calculate a brew";
  @property({ type: String, attribute: "cta-href" }) ctaHref = "/calculate";

  render(): HTMLTemplateResult {
    return html`
      <div class="empty-state">
        <img
          class="empty-state-image"
          src="${this.image}"
          alt=""
          width="117"
          height="187"
          fetchpriority="high"
        />
        <p class="empty-state-message">${this.message}</p>
        ${
          this.ctaLabel && this.ctaHref
            ? html`<brew-button variant="filled" href="${this.ctaHref}"
                >${this.ctaLabel}</brew-button
              >`
            : nothing
        }
      </div>
    `;
  }
}
