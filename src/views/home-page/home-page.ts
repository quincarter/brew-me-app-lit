import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/action-tile/brew-action-tile";
import "../../components/avatar/brew-avatar";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/empty-state/brew-empty-state";
import "../../components/stat-tile/brew-stat-tile";
import {
  recentBrewsSignal,
  streakDaysSignal,
  totalBrewsSignal,
} from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
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

  render(): HTMLTemplateResult {
    const recent = recentBrewsSignal.value;

    return html`
      <div class="screen">
        <div class="scroll">
          <div class="greeting">
            <div class="eyebrow">${getGreeting()}</div>
            <div class="headline">Let's brew</div>
          </div>

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
                    ${recent.map((brew, index) => {
                      const colors = getAvatarColors(index);
                      return html`
                        <a class="recent-card" href="/saved/${brew.id}">
                          <brew-avatar
                            initial="${getInitial(brew.brewType)}"
                            background="${colors.background}"
                            foreground="${colors.foreground}"
                            size="32"
                          ></brew-avatar>
                          <span class="recent-type">${brew.brewType}</span>
                          <span class="recent-stats">
                            <span class="recent-ratio">${brew.ratio}:1 · ${brew.coffee}g coffee</span>
                            <span class="recent-detail">${brew.water}g water · ${brew.oz}oz</span>
                          </span>
                        </a>
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
