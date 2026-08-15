import { type HTMLTemplateResult, html, LitElement, nothing, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { LinkCardStyles } from "./link-card.styles";
import { OPEN_IN_NEW_ICON_SVG } from "../../shared/icons/open-in-new.svg";
import { CHEVRON_RIGHT_ICON_SVG } from "../../shared/icons/chevron-right.svg";

/**
 * # Link Card
 * A tappable card row - leading icon, title, subtitle, trailing chevron/
 * external-link icon - used anywhere a screen points somewhere else:
 * a brew guide's "recipes" or "learn more" links, a saved brew's matching
 * guide, or an attribution link out to a data source. Renders as an `<a>`;
 * set `external` for links that leave the app (opens in a new tab with
 * `rel="noopener noreferrer"` and an "open in new" trailing icon) versus
 * in-app navigation (same tab, trailing chevron - the app router's global
 * click handling intercepts it).
 * ## Usage
 * ```html
 * <brew-link-card
 *   href="/more/guide/v60"
 *   icon="menu_book"
 *   label="V60 Brew Guide"
 *   description="Ratio tips, grind size, and video walkthroughs"
 * ></brew-link-card>
 * <brew-link-card
 *   href="https://example.com"
 *   icon="info"
 *   label="Background and brewing notes"
 *   description="From Roastopedia"
 *   external
 * ></brew-link-card>
 * ```
 * @element brew-link-card
 */
export class LinkCard extends LitElement {
  static styles = [LinkCardStyles];

  @property({ type: String }) href = "";
  @property({ type: String }) icon = "";
  @property({ type: String }) svg: SVGTemplateResult | null = null;
  @property({ type: String }) label = "";
  @property({ type: String }) description = "";
  @property({ type: Boolean }) external = false;

  render(): HTMLTemplateResult {
    return html`
      <a
        class="link-card"
        href="${this.href}"
        target="${this.external ? "_blank" : nothing}"
        rel="${this.external ? "noopener noreferrer" : nothing}"
      >
        <span class="link-icon"
          >${
            this.icon && !this.svg
              ? html`<brew-icon name="${this.icon}" size="24"></brew-icon>`
              : nothing
          }${
            this.svg && !this.icon
              ? html`<brew-icon .svg="${this.svg}" size="24"></brew-icon>`
              : nothing
          }</span
        >
        <span class="link-text">
          <span class="link-title">${this.label}</span>
          <span class="link-subtitle">${this.description}</span>
        </span>
        <brew-icon
          .svg="${this.external ? OPEN_IN_NEW_ICON_SVG : CHEVRON_RIGHT_ICON_SVG}"
          size="${this.external ? 20 : 24}"
        ></brew-icon>
      </a>
    `;
  }
}
