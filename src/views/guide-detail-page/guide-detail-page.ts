import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon-button/brew-icon-button";
import "../../components/icon/brew-icon";
import "../../components/top-bar/brew-top-bar";
import "../../components/video-card/brew-video-card";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import { primeCalculatorForRatio } from "../../shared/stores/calculator.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { GuideDetailPageStyles } from "./guide-detail-page.styles";

@customElement("guide-detail-page")
export class GuideDetailPage extends SignalWatcher(LitElement) {
  static styles = [GuideDetailPageStyles, responsiveScreenStyles];

  @property({ type: Object }) routeParams: Record<string, string | undefined> = {};

  @state() private _aiTipIndex = 0;
  @state() private _tipsForGuideId: string | null = null;

  protected willUpdate(): void {
    const guide = BREW_GUIDE.find((item) => item.id === this.routeParams.id) ?? BREW_GUIDE[0];
    if (this._tipsForGuideId !== guide.id) {
      this._tipsForGuideId = guide.id;
      this._aiTipIndex = 0;
    }
  }

  private _watchVideo(guideName: string): void {
    const query = encodeURIComponent(`${guideName} coffee brewing guide`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noopener");
  }

  private _regenerateTip(tipCount: number): void {
    this._aiTipIndex = (this._aiTipIndex + 1) % tipCount;
  }

  private _calcThisRatio(ratioDefault: number): void {
    primeCalculatorForRatio(ratioDefault);
    navigateTo("/calculate");
  }

  render(): HTMLTemplateResult {
    const guide = BREW_GUIDE.find((item) => item.id === this.routeParams.id) ?? BREW_GUIDE[0];
    const savedMatch = savedBrewsSignal.value.find((brew) => brew.brewType === guide.name);

    return html`
      <div class="screen">
        <brew-top-bar title="${guide.name}" icon="arrow_back" href="/more"></brew-top-bar>

        <div class="content">
          <p class="description">${guide.desc}</p>

          ${
            guide.videos.length > 0
              ? html`
                  <section class="videos">
                    <h2 class="section-title">Watch a walkthrough</h2>
                    ${guide.videos.map(
                      (video) => html`
                        <brew-video-card
                          youtube-id="${video.youtubeId}"
                          video-title="${video.title}"
                          channel="${video.channel}"
                        ></brew-video-card>
                      `,
                    )}
                  </section>
                `
              : nothing
          }

          <div class="video-search">
            <span class="video-icon"><brew-icon name="play_circle" size="26"></brew-icon></span>
            <span class="video-text">
              <span class="video-search-title">
                ${guide.videos.length > 0 ? "Looking for more?" : "Watch a walkthrough"}
              </span>
              <span class="video-subtitle">
                Find ${guide.videos.length > 0 ? "more " : ""}video guides on YouTube
              </span>
            </span>
            <brew-button variant="outlined" @button-click="${() => this._watchVideo(guide.name)}"
              >Search</brew-button
            >
          </div>

          ${
            guide.recipesLink
              ? html`
                  <a class="recipes-link" href="${guide.recipesLink.route}">
                    <span class="recipes-icon"
                      ><brew-icon name="menu_book" size="24"></brew-icon
                    ></span>
                    <span class="recipes-text">
                      <span class="recipes-title">${guide.recipesLink.label}</span>
                      <span class="recipes-subtitle">${guide.recipesLink.description}</span>
                    </span>
                    <brew-icon name="chevron_right"></brew-icon>
                  </a>
                `
              : nothing
          }

          ${
            guide.externalLinks
              ? guide.externalLinks.map(
                  (link) => html`
                    <a
                      class="recipes-link"
                      href="${link.url}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="recipes-icon"
                        ><brew-icon name="info" size="24"></brew-icon
                      ></span>
                      <span class="recipes-text">
                        <span class="recipes-title">${link.label}</span>
                        <span class="recipes-subtitle">${link.description}</span>
                      </span>
                      <brew-icon name="open_in_new" size="20"></brew-icon>
                    </a>
                  `,
                )
              : nothing
          }

          <div class="stat-row">
            <div class="stat">
              <div class="stat-value">${guide.ratioHint}</div>
              <div class="stat-label">ratio</div>
            </div>
            <div class="stat">
              <div class="stat-value">${guide.grind}</div>
              <div class="stat-label">grind size</div>
            </div>
            <div class="stat">
              <div class="stat-value">${guide.temp}</div>
              <div class="stat-label">water temp</div>
            </div>
          </div>

          <div class="ai-tip">
            <div class="ai-tip-header">
              <brew-icon name="auto_awesome" size="20"></brew-icon>
              <span class="ai-tip-title">AI tip</span>
              <brew-icon-button
                icon="refresh"
                aria-label="Another tip"
                @icon-click="${() => this._regenerateTip(guide.aiTips.length)}"
              ></brew-icon-button>
            </div>
            <p class="ai-tip-body">${guide.aiTips[this._aiTipIndex % guide.aiTips.length]}</p>
          </div>

          ${
            savedMatch
              ? html`
                  <a class="saved-match" href="/saved/${savedMatch.id}">
                    <span class="saved-match-text">
                      <span class="saved-match-eyebrow">Your saved ratio</span>
                      <span class="saved-match-value"
                        >${savedMatch.ratio}:1 · ${savedMatch.coffee}g coffee</span
                      >
                    </span>
                    <brew-icon name="chevron_right"></brew-icon>
                  </a>
                `
              : html`
                  <div class="no-match">
                    <p>You haven't saved a ${guide.name} ratio yet.</p>
                    <brew-button
                      variant="filled"
                      @button-click="${() => this._calcThisRatio(guide.ratioDefault)}"
                      >Calculate this ratio</brew-button
                    >
                  </div>
                `
          }
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
