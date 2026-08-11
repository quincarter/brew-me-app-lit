import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/list-row/brew-list-row";
import "../../components/stat-tile/brew-stat-tile";
import "../../components/top-bar/brew-top-bar";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import { streakDaysSignal, totalBrewsSignal } from "../../shared/stores/brew.store";
import { startTour } from "../../shared/stores/tour.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getInitial } from "../../shared/utilities/avatar-palette.utility";
import { MorePageStyles } from "./more-page.styles";

@customElement("more-page")
export class MorePage extends SignalWatcher(LitElement) {
  static styles = [MorePageStyles, responsiveScreenStyles];

  private _onTakeTourClick = (event: Event): void => {
    event.preventDefault();
    startTour();
  };

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar title="More"></brew-top-bar>

        <div class="content">
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

          <div class="divider"></div>
          <div class="section-title">Settings</div>
          <brew-list-row
            headline="Settings"
            supporting="Brew types, dark mode, refresh, data"
            leading-icon="settings"
            leading-bg="var(--brew-color-surface-container-high)"
            leading-fg="var(--brew-color-on-surface)"
            href="/more/settings"
          ></brew-list-row>

          <div class="divider"></div>
          <div class="section-title">Help</div>
          <brew-list-row
            headline="Take the tour"
            supporting="Replay the BrewMe walkthrough"
            leading-icon="explore"
            leading-bg="var(--brew-color-primary-container)"
            leading-fg="var(--brew-color-on-primary-container)"
            href="/more"
            @click="${this._onTakeTourClick}"
          ></brew-list-row>

          <div class="divider"></div>
          <div class="section-title">Brewing tools</div>
          <brew-list-row
            headline="Pour-over Timer"
            supporting="Guided brew countdown"
            leading-icon="timer"
            leading-bg="var(--brew-color-tertiary-container)"
            leading-fg="var(--brew-color-on-tertiary-container)"
            href="/timer"
          ></brew-list-row>
          <brew-list-row
            headline="WAC Recipes"
            supporting="World AeroPress Championship winners"
            leading-icon="menu_book"
            leading-bg="var(--brew-color-tertiary-container)"
            leading-fg="var(--brew-color-on-tertiary-container)"
            href="/more/aeropress-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="V60 Recipes"
            supporting="Expert pour-over recipes compared"
            leading-icon="menu_book"
            leading-bg="var(--brew-color-tertiary-container)"
            leading-fg="var(--brew-color-on-tertiary-container)"
            href="/more/v60-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Origami Recipes"
            supporting="Champion &amp; barista dripper recipes"
            leading-icon="menu_book"
            leading-bg="var(--brew-color-tertiary-container)"
            leading-fg="var(--brew-color-on-tertiary-container)"
            href="/more/origami-recipes"
          ></brew-list-row>

          <div class="divider"></div>
          <div class="section-title" data-tour="more-guides-section">Brew method guide</div>
          ${BREW_GUIDE.map(
            (guide, index) => html`
              <brew-list-row
                headline="${guide.name}"
                supporting="${guide.ratioHint} · ${guide.grind} grind"
                leading-initial="${getInitial(guide.name)}"
                data-tour="${index === 0 ? "more-guide-row" : nothing}"
                href="/more/guide/${guide.id}"
              ></brew-list-row>
            `,
          )}
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
