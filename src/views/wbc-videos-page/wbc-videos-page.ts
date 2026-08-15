import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/icon/brew-icon";
import "../../components/link-card/brew-link-card";
import "../../components/top-bar/brew-top-bar";
import "../../components/video-card/brew-video-card";
import {
  WBC_MISC_VIDEOS,
  WBC_PLAYLISTS,
  WBC_ROUTINES,
  WBC_UPCOMING_EVENT,
} from "../../shared/data/wbc-content.data";
import {
  ARROW_BACK_ICON_SVG,
  EMOJI_EVENTS_ICON_SVG,
  EVENT_ICON_SVG,
} from "../../shared/icons/icons";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { WbcVideosPageStyles } from "./wbc-videos-page.styles";

@customElement("wbc-videos-page")
export class WbcVideosPage extends LitElement {
  static styles = [WbcVideosPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    const event = WBC_UPCOMING_EVENT;

    return html`
      <div class="screen">
        <brew-top-bar
          title="World Barista Championship"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more"
        ></brew-top-bar>

        <div class="content">
          <!-- Upcoming Event Banner -->
          <div class="event-card">
            <div class="event-header">
              <h2 class="event-title">${event.title}</h2>
              <span class="event-badge">
                <brew-icon .svg="${EVENT_ICON_SVG}" size="16"></brew-icon>
                ${event.dates} · ${event.location}
              </span>
            </div>
            <p class="event-desc">${event.description}</p>
            <div class="event-links">
              <brew-link-card
                href="${event.worldOfCoffeeUrl}"
                icon="public"
                label="World of Coffee (Panama 2026)"
                description="Official event page &amp; schedule details for Panama"
                external
              ></brew-link-card>
              <brew-link-card
                href="${event.wbcOfficialUrl}"
                .svg=${EMOJI_EVENTS_ICON_SVG}
                label="World Barista Championship Official"
                description="Competition rules, competitor stats &amp; WCC news"
                external
              ></brew-link-card>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Championship Routines Section -->
          <h3 class="section-title">Winning Championship Routines</h3>
          <div class="video-list">
            ${WBC_ROUTINES.map(
              (video) => html`
                <brew-video-card
                  youtube-id="${video.youtubeId}"
                  video-title="${video.title}"
                  channel="${video.channel}"
                ></brew-video-card>
              `,
            )}
          </div>

          <div class="divider"></div>

          <!-- Misc & Behind the Scenes Section -->
          <h3 class="section-title">
            Beverage Breakdown &amp; Behind the Scenes
          </h3>
          <div class="video-list">
            ${WBC_MISC_VIDEOS.map(
              (video) => html`
                <brew-video-card
                  youtube-id="${video.youtubeId}"
                  video-title="${video.title}"
                  channel="${video.channel}"
                ></brew-video-card>
              `,
            )}
          </div>

          <div class="divider"></div>

          <!-- Playlists Section -->
          <h3 class="section-title">Official Playlists</h3>
          <div class="playlist-list">
            ${WBC_PLAYLISTS.map(
              (playlist) => html`
                <brew-link-card
                  href="${playlist.url}"
                  icon="play_circle"
                  label="${playlist.title}"
                  description="${playlist.description}"
                  external
                ></brew-link-card>
              `,
            )}
          </div>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
