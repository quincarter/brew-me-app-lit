import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/action-tile/brew-action-tile";
import "../../components/avatar/brew-avatar";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/empty-state/brew-empty-state";
import "../../components/icon-button/brew-icon-button";
import "../../components/saved-card/brew-saved-card";
import "../../components/stat-tile/brew-stat-tile";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { brewAgain } from "../../shared/stores/calculator.store";
import {
  mostRecentlyBrewedSignal,
  recentSavedBrewsSignal,
  streakDaysSignal,
  totalBrewsSignal,
} from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import { formatRelativeDay } from "../../shared/utilities/relative-date.utility";
import { HomePageStyles } from "./home-page.styles";

/** A real time-of-day greeting instead of a hardcoded one. */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

@customElement("home-page")
export class HomePage extends SignalWatcher(LitElement) {
  static styles = [HomePageStyles, responsiveScreenStyles];

  private _renderBrewAgainCard(brew: ISavedBrew): HTMLTemplateResult {
    const relative = formatRelativeDay(brew.lastBrewedAt ?? brew.createdAt);
    const relativeLower = relative.charAt(0).toLowerCase() + relative.slice(1);

    return html`
      <div class="brew-again-card">
        <brew-avatar
          initial="${getInitial(getBrewDisplayName(brew))}"
          background="var(--brew-color-surface)"
          foreground="var(--brew-color-on-primary-container)"
          size="48"
          .icon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
        ></brew-avatar>
        <span class="brew-again-text">
          <span class="brew-again-eyebrow">Brew again</span>
          <span class="brew-again-name"
            >${getBrewDisplayName(brew)} · ${formatRatio(brew.ratio)}</span
          >
          <span class="brew-again-meta">Last brewed ${relativeLower}</span>
        </span>
        <brew-icon-button
          icon="replay"
          variant="filled"
          aria-label="Brew again"
          style="--icon-button-size: 44px"
          @icon-click="${() => brewAgain(brew)}"
        ></brew-icon-button>
      </div>
    `;
  }

  render(): HTMLTemplateResult {
    const recent = recentSavedBrewsSignal.value;
    const mostRecent = mostRecentlyBrewedSignal.value;

    return html`
      <div class="screen">
        <div class="scroll">
          <div class="greeting">
            <div class="eyebrow">${getGreeting()}</div>
            <div class="headline">Ready to brew?</div>
          </div>

          ${mostRecent ? this._renderBrewAgainCard(mostRecent) : nothing}

          <div class="actions">
            <brew-action-tile
              icon="calculate"
              label="Calculate"
              tone="primary"
              href="/calculate"
            ></brew-action-tile>
            <brew-action-tile
              icon="bookmark"
              label="Saved Brews"
              tone="secondary"
              href="/saved"
            ></brew-action-tile>
            <brew-action-tile
              icon="timer"
              label="Timer"
              tone="tertiary"
              href="/timer"
            ></brew-action-tile>
          </div>

          <div class="stats">
            <brew-stat-tile
              icon="bookmark_added"
              value="${totalBrewsSignal.value}"
              label="saved brews"
            ></brew-stat-tile>
            <brew-stat-tile
              icon="local_fire_department"
              value="${streakDaysSignal.value}"
              label="day streak"
            ></brew-stat-tile>
          </div>

          <div class="section-header">
            <span class="section-title">Recent brews</span>
            <a class="see-all" href="/saved">See all</a>
          </div>

          ${
            recent.length === 0
              ? html`<brew-empty-state class="recent-empty"></brew-empty-state>`
              : html`
                  <div class="recent-row">
                    ${recent.map((brew) => {
                      const colors = getAvatarColors(brew.id);
                      return html`
                        <brew-saved-card
                          href="/saved/${brew.id}"
                          brew-type="${getBrewDisplayName(brew)}"
                          ratio="${brew.ratio}"
                          coffee="${brew.coffee}"
                          water="${brew.water}"
                          oz="${brew.oz}"
                          avatar-initial="${getInitial(getBrewDisplayName(brew))}"
                          avatar-bg="${colors.background}"
                          avatar-fg="${colors.foreground}"
                          .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
                          rating="${brew.rating ?? 0}"
                          ?replayable="${true}"
                          @replay-click="${() => brewAgain(brew)}"
                        ></brew-saved-card>
                      `;
                    })}
                  </div>
                `
          }
        </div>

        <brew-bottom-nav active="home"></brew-bottom-nav>
      </div>
    `;
  }
}
