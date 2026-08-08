import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../button/brew-button";
import "../icon/brew-icon";
import { VideoSearchStyles } from "./video-search.styles";

/**
 * # Video Search
 * The "search YouTube for a walkthrough" prompt - shown below the curated
 * videos on a brew guide's detail screen, and on a saved brew's detail
 * screen in place of a guide link when its brew type has no curated guide
 * (e.g. a custom brew type).
 * ## Usage
 * ```html
 * <brew-video-search query="V60 coffee brewing guide"></brew-video-search>
 * <brew-video-search
 *   title="Looking for more?"
 *   subtitle="Find more video guides on YouTube"
 *   query="V60 coffee brewing guide"
 * ></brew-video-search>
 * ```
 * @element brew-video-search
 */
export class VideoSearch extends LitElement {
  static styles = [VideoSearchStyles];

  @property({ type: String }) title = "Watch a walkthrough";
  @property({ type: String }) subtitle = "Find video guides on YouTube";
  /** The raw YouTube search text, e.g. "V60 coffee brewing guide". */
  @property({ type: String }) query = "";

  private _onSearch = (): void => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(this.query)}`;
    window.open(url, "_blank", "noopener");
  };

  render(): HTMLTemplateResult {
    return html`
      <div class="video-search">
        <span class="video-icon"><brew-icon name="play_circle" size="26"></brew-icon></span>
        <span class="video-text">
          <span class="video-search-title">${this.title}</span>
          <span class="video-subtitle">${this.subtitle}</span>
        </span>
        <brew-button variant="outlined" @button-click="${this._onSearch}">Search</brew-button>
      </div>
    `;
  }
}
