import { type HTMLTemplateResult, html, LitElement, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon-button/brew-icon-button";
import { TopBarStyles } from "./top-bar.styles";
import { LOCAL_CAFE_ICON_SVG } from "../../shared/icons/icons";

/**
 * # Top Bar
 * The screen header used on every non-home BrewMe screen: a leading
 * icon-link (home or back) plus a title.
 * ## Usage
 * ```html
 * <brew-top-bar title="Calculator"></brew-top-bar>
 * <brew-top-bar title="Saved Brews" icon="arrow_back" href="/saved"></brew-top-bar>
 * ```
 * @element brew-top-bar
 */
export class TopBar extends LitElement {
  static styles = [TopBarStyles];

  @property({ type: String }) title = "";
  @property({ type: String }) icon: SVGTemplateResult = LOCAL_CAFE_ICON_SVG;
  @property({ type: String }) href = "/";
  @property({ type: String, attribute: "aria-label-text" }) ariaLabelText = "Home";

  render(): HTMLTemplateResult {
    return html`
      <div class="bar">
        <brew-icon-button
          .svgIcon="${this.icon}"
          href="${this.href}"
          aria-label="${this.ariaLabelText}"
        ></brew-icon-button>
        <span class="title">${this.title}</span>
      </div>
    `;
  }
}
