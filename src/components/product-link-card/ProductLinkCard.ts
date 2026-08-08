import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { ProductLinkCardStyles } from "./product-link-card.styles";

/**
 * # Product Link Card
 * A tappable card row for a paid/affiliate product recommendation on a brew
 * guide's detail screen - e.g. gear worth buying. Visually similar to
 * `brew-link-card`, but always shows an "Affiliate link" badge next to the
 * title and defaults to a shopping icon, since these are monetized links
 * and must be distinguishable from editorial "further reading" links.
 * Always opens in a new tab with `rel="noopener noreferrer"`.
 * ## Usage
 * ```html
 * <brew-product-link-card
 *   href="https://amzn.to/example"
 *   label="Nitro Cold Brew Kegs — Royal Brew"
 *   description="A home nitro cold brew kegging system"
 * ></brew-product-link-card>
 * ```
 * @element brew-product-link-card
 */
export class ProductLinkCard extends LitElement {
  static styles = [ProductLinkCardStyles];

  @property({ type: String }) href = "";
  @property({ type: String }) label = "";
  @property({ type: String }) description = "";
  /** Material Symbols icon name for the leading icon. @attr icon */
  @property({ type: String }) icon = "shopping_bag";

  render(): HTMLTemplateResult {
    return html`
      <a
        class="product-link-card"
        href="${this.href}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="product-icon"
          ><brew-icon name="${this.icon}" size="24"></brew-icon
        ></span>
        <div class="wrapper">
          <div class="affiliate-badge">Affiliate link</div>
          <span class="product-text">
            <span class="product-title-row">
              <span class="product-title">${this.label}</span>
            </span>
            <span class="product-subtitle">${this.description}</span>
          </span>
        </div>
        <brew-icon name="open_in_new" size="20"></brew-icon>
      </a>
    `;
  }
}
