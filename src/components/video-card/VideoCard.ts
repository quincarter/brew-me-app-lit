import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import "../icon/brew-icon";
import { VideoCardStyles } from "./video-card.styles";
import { OPEN_IN_NEW_ICON_SVG } from "../../shared/icons/icons";

/**
 * # Video Card
 * A "lite" YouTube embed: renders only the poster image up front and swaps
 * in the real iframe when the user activates it. That keeps YouTube's
 * player scripts and cookies off the page entirely unless someone actually
 * wants to watch, which matters here because guide screens can list several
 * videos at once.
 *
 * Uses the youtube-nocookie.com domain for the embed.
 *
 * ## Usage
 * ```html
 * <brew-video-card
 *   youtube-id="ikt-X5x7yoc"
 *   video-title="The Chemex"
 *   channel="James Hoffmann"
 * ></brew-video-card>
 * ```
 * @element brew-video-card
 */
export class VideoCard extends LitElement {
  static styles = [VideoCardStyles];

  @property({ type: String, attribute: "youtube-id" }) youtubeId = "";
  /** Named `videoTitle` rather than `title` to avoid shadowing `HTMLElement.title` (which renders a tooltip). */
  @property({ type: String, attribute: "video-title" }) videoTitle = "";
  @property({ type: String }) channel = "";

  @state() private _playing = false;

  private _play = (): void => {
    this._playing = true;
  };

  /** Medium-quality thumbnail: universally available, unlike maxresdefault. */
  private get _posterUrl(): string {
    return `https://i.ytimg.com/vi/${this.youtubeId}/hqdefault.jpg`;
  }

  private get _watchUrl(): string {
    return `https://www.youtube.com/watch?v=${this.youtubeId}`;
  }

  private _renderPlayer(): HTMLTemplateResult {
    if (!this._playing) {
      return html`
        <button
          class="poster"
          type="button"
          @click="${this._play}"
          aria-label="Play ${this.videoTitle}"
        >
          <img src="${this._posterUrl}" alt="" loading="lazy" />
          <span class="play-badge"><brew-icon name="play_arrow" size="28"></brew-icon></span>
        </button>
      `;
    }

    return html`
      <iframe
        class="player"
        src="https://www.youtube-nocookie.com/embed/${this.youtubeId}?autoplay=1&rel=0"
        title="${this.videoTitle}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    `;
  }

  render(): HTMLTemplateResult {
    return html`
      <div class="card">
        <div class="frame">${this._renderPlayer()}</div>
        <div class="meta">
          <span class="video-title">${this.videoTitle}</span>
          ${this.channel ? html`<span class="channel">${this.channel}</span>` : nothing}
          <a class="external" href="${this._watchUrl}" target="_blank" rel="noopener noreferrer">
            Watch on YouTube
            <brew-icon .svg="${OPEN_IN_NEW_ICON_SVG}" size="14"></brew-icon>
          </a>
        </div>
      </div>
    `;
  }
}
