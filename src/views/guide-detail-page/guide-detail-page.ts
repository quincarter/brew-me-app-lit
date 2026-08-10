import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/glossary-item/brew-glossary-item";
import "../../components/icon-button/brew-icon-button";
import "../../components/icon/brew-icon";
import "../../components/link-card/brew-link-card";
import "../../components/product-link-card/brew-product-link-card";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import "../../components/video-card/brew-video-card";
import "../../components/video-search/brew-video-search";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import { primeCalculatorForRatio } from "../../shared/stores/calculator.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
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

  private _regenerateTip(tipCount: number): void {
    this._aiTipIndex = (this._aiTipIndex + 1) % tipCount;
  }

  private _calcThisRatio(ratioDefault: number, brewType: string): void {
    primeCalculatorForRatio(ratioDefault, brewType);
    navigateTo("/calculate");
  }

  render(): HTMLTemplateResult {
    const guide = BREW_GUIDE.find((item) => item.id === this.routeParams.id) ?? BREW_GUIDE[0];
    const savedMatches = savedBrewsSignal.value.filter((brew) => brew.brewType === guide.name);

    return html`
      <div class="screen">
        <brew-top-bar title="${guide.name}" icon="arrow_back" href="/more"></brew-top-bar>

        <div class="content">
          <p class="description">${guide.desc}</p>

          ${
            guide.recipesLink
              ? html`
                  <brew-link-card
                    href="${guide.recipesLink.route}"
                    icon="menu_book"
                    label="${guide.recipesLink.label}"
                    description="${guide.recipesLink.description}"
                  ></brew-link-card>
                `
              : nothing
          }
          ${
            guide.externalLinks
              ? guide.externalLinks.map(
                  (link) => html`
                    <brew-link-card
                      href="${link.url}"
                      icon="info"
                      label="${link.label}"
                      description="${link.description}"
                      external
                    ></brew-link-card>
                  `,
                )
              : nothing
          }

          <div class="stat-row" data-tour="guide-stats">
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
            savedMatches.length > 0
              ? html`
                  <section class="saved-matches">
                    <h2 class="section-title">Recent ${guide.name} Brews</h2>
                    <div class="saved-match-row">
                      ${savedMatches.map((brew, index) => {
                        const colors = getAvatarColors(index);
                        return html`
                          <brew-saved-card
                            href="/saved/${brew.id}"
                            brew-type="${brew.brewType}"
                            ratio="${brew.ratio}"
                            coffee="${brew.coffee}"
                            water="${brew.water}"
                            oz="${brew.oz}"
                            avatar-initial="${getInitial(brew.brewType)}"
                            avatar-bg="${colors.background}"
                            avatar-fg="${colors.foreground}"
                            .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
                          ></brew-saved-card>
                        `;
                      })}
                    </div>
                  </section>
                `
              : html`
                  <div class="no-match">
                    <p>You haven't saved a ${guide.name} ratio yet.</p>
                    <brew-button
                      variant="filled"
                      @button-click="${() => this._calcThisRatio(guide.ratioDefault, guide.name)}"
                      >Calculate this ratio</brew-button
                    >
                  </div>
                `
          }
          ${
            guide.glossary && guide.glossary.length > 0
              ? html`
                  <section class="glossary">
                    <h2 class="section-title">Terminology &amp; tools</h2>
                    ${guide.glossary.map(
                      (item) => html`
                        <brew-glossary-item
                          term="${item.term}"
                          definition="${item.definition}"
                        ></brew-glossary-item>
                      `,
                    )}
                  </section>
                `
              : nothing
          }
          ${
            guide.productLinks
              ? html`
                  <section class="product-links">
                    <h2 class="section-title">Products</h2>

                    ${guide.productLinks.map(
                      (link) => html`
                        <brew-product-link-card
                          href="${link.url}"
                          label="${link.label}"
                          description="${link.description}"
                        ></brew-product-link-card>
                      `,
                    )}
                  </section>
                `
              : nothing
          }
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

          <brew-video-search
            title="${guide.videos.length > 0 ? "Looking for more?" : "Watch a walkthrough"}"
            subtitle="Find ${guide.videos.length > 0 ? "more " : ""}video guides on YouTube"
            query="${guide.name} coffee brewing guide"
          ></brew-video-search>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
