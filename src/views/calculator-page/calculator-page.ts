import { SignalWatcher } from "@lit-labs/preact-signals";
import { html, LitElement, nothing, type HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon-button/brew-icon-button";
import "../../components/icon/brew-icon";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import { REFRESH_ICON, SHARE_ICON } from "../../shared/icons/icons";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { brewAgain, recentSavedBrewsSignal } from "../../shared/stores/brew.store";
import {
  coffeeSignal,
  dismissPrimedBanner,
  ozSignal,
  primedFromNameSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  waterSignal,
} from "../../shared/stores/calculator.store";
import { openPostSaveSheet } from "../../shared/stores/post-save-sheet.store";
import { openSaveDialog } from "../../shared/stores/save-dialog.store";
import { primeTimerForSavedBrew } from "../../shared/stores/timer.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { SHARE_OUTCOME_MESSAGES, type ShareOutcome } from "../../shared/utilities/share.utility";
import { CalculatorPageStyles } from "./calculator-page.styles";

@customElement("calculator-page")
export class CalculatorPage extends SignalWatcher(LitElement) {
  static styles = [CalculatorPageStyles, responsiveScreenStyles];

  @state() private _shareStatusText = "";

  private _statusTimeout: ReturnType<typeof setTimeout> | undefined;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._statusTimeout);
  }

  private _showStatus(text: string): void {
    clearTimeout(this._statusTimeout);
    this._shareStatusText = text;
    if (!text) return;
    this._statusTimeout = setTimeout(() => {
      this._shareStatusText = "";
    }, 2500);
  }

  render(): HTMLTemplateResult {
    const coffee = coffeeSignal.value;
    const water = waterSignal.value;
    const oz = ozSignal.value;
    const isValid = Boolean(water && oz && coffee);
    const recentBrews = recentSavedBrewsSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Calculator"></brew-top-bar>

        <div class="content">
          ${
            primedFromNameSignal.value
              ? html`
                  <div class="primed-banner">
                    <brew-icon name="replay" size="18"></brew-icon>
                    <span class="primed-banner-text"
                      >Loaded from ${primedFromNameSignal.value}</span
                    >
                    <brew-icon-button
                      icon="close"
                      size="18"
                      aria-label="Dismiss"
                      @icon-click="${dismissPrimedBanner}"
                    ></brew-icon-button>
                  </div>
                `
              : nothing
          }

          <brew-ratio-form
            ratio="${ratioSignal.value}"
            water="${water}"
            oz="${oz}"
            .coffee="${coffee}"
            @ratio-change="${(e: CustomEvent<string>) => setRatio(e.detail)}"
            @water-change="${(e: CustomEvent<string>) => setWater(e.detail)}"
            @oz-change="${(e: CustomEvent<string>) => setOz(e.detail)}"
          ></brew-ratio-form>

          <div class="row actions">
            <brew-button variant="outlined" full-width @button-click="${resetCalculator}"
              ><brew-icon .svg=${REFRESH_ICON} size="18"></brew-icon> Reset</brew-button
            >
            <brew-button
              variant="outlined"
              full-width
              ?disabled="${!isValid}"
              @button-click="${() => openSaveDialog({ intent: "share" })}"
              ><brew-icon .svg=${SHARE_ICON} size="18"></brew-icon> Share</brew-button
            >
          </div>
          <brew-button
            variant="outlined"
            full-width
            ?disabled="${!isValid}"
            @button-click="${() => openSaveDialog({ intent: "guided-timer" })}"
            ><brew-icon name="timer" size="22"></brew-icon> Start guided timer</brew-button
          >
          <brew-button
            variant="filled"
            full-width
            large
            ?disabled="${!isValid}"
            @button-click="${openSaveDialog}"
            ><brew-icon name="bookmark" size="18"></brew-icon> Save</brew-button
          >
          ${
            this._shareStatusText
              ? html`<p class="share-status">${this._shareStatusText}</p>`
              : null
          }

          <div class="ratio-tips">
            <div class="ratio-tips-header">
              <brew-icon name="info" size="20"></brew-icon>
              <span class="ratio-tips-title">Ratio tips</span>
            </div>
            <p class="ratio-tips-body">Lower ratio = stronger, more intense brew.</p>
            <p class="ratio-tips-body">Higher ratio = weaker, lighter cup.</p>
            <p class="ratio-tips-body">
              As always - Adjust to taste. If it tastes good, the math and numbers are just numbers.
            </p>
            <span class="ratio-tips-body">Brew Examples</span>
            <ul class="ratio-tips-body">
              <li>Pour-over/drip: 1:15–18</li>
              <li>Espresso: 1:2</li>
              <li>Cold brew: 1:3–5</li>
            </ul>
          </div>

          ${
            recentBrews.length > 0
              ? html`
                  <div class="section-header">
                    <span class="section-title">Recent brews</span>
                    <a class="see-all" href="/saved">See all</a>
                  </div>

                  <div class="recent-row">
                    ${recentBrews.map((brew) => {
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
                          .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon) ?? null}"
                          rating="${brew.rating ?? 0}"
                          ?replayable="${true}"
                          @replay-click="${() => brewAgain(brew)}"
                        ></brew-saved-card>
                      `;
                    })}
                  </div>
                `
              : null
          }
        </div>

        <brew-bottom-nav active="calculate"></brew-bottom-nav>
        <brew-save-sheet
          @brew-share-outcome="${(e: CustomEvent<ShareOutcome>) =>
            this._showStatus(SHARE_OUTCOME_MESSAGES[e.detail])}"
          @brew-saved="${(e: CustomEvent<ISavedBrew>) => openPostSaveSheet(e.detail)}"
          @brew-guided-timer-ready="${(e: CustomEvent<ISavedBrew>) => {
            primeTimerForSavedBrew(e.detail);
            navigateTo("/timer");
          }}"
        ></brew-save-sheet>
      </div>
    `;
  }
}
