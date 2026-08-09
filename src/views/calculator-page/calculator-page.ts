import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/icon-button/brew-icon-button";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import { REFRESH_ICON, SHARE_ICON } from "../../shared/icons/icons";
import { recentSavedBrewsSignal } from "../../shared/stores/brew.store";
import {
  brewAgain,
  coffeeSignal,
  dismissPrimedBanner,
  ozSignal,
  primedBrewTypeSignal,
  primedFromNameSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  waterSignal,
} from "../../shared/stores/calculator.store";
import { openSaveDialog } from "../../shared/stores/save-dialog.store";
import { primeTimerForRecipe } from "../../shared/stores/timer.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
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

  private _onStartGuidedTimer = (): void => {
    const coffee = coffeeSignal.value;
    const water = Number.parseFloat(waterSignal.value);
    const ratio = Number.parseFloat(ratioSignal.value);
    if (coffee === null || Number.isNaN(water) || Number.isNaN(ratio)) return;

    const brewType = primedBrewTypeSignal.value;
    const guide = brewType ? BREW_GUIDE.find((item) => item.name === brewType) : undefined;

    primeTimerForRecipe({
      name: primedFromNameSignal.value ?? "Custom Ratio",
      coffee,
      water,
      ratio,
      targetSeconds: guide?.brewTimeSeconds ?? null,
    });
    navigateTo("/timer");
  };

  render(): HTMLTemplateResult {
    const coffee = coffeeSignal.value;
    const water = waterSignal.value;
    const oz = ozSignal.value;
    const isValid = Boolean(water && oz && coffee);
    const recentBrews = recentSavedBrewsSignal.value;
    const ratioNumber = Number.parseFloat(ratioSignal.value);

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

          ${
            !Number.isNaN(ratioNumber) && ratioNumber
              ? html`<span class="ratio-chip">Ratio ${formatRatio(ratioNumber)}</span>`
              : nothing
          }

          <brew-button variant="outlined" full-width @button-click="${resetCalculator}"
            ><brew-icon .svg="${REFRESH_ICON}" size="18"></brew-icon> Reset</brew-button
          >

          <div class="row actions">
            <brew-button
              variant="outlined"
              full-width
              ?disabled="${!isValid}"
              @button-click="${openSaveDialog}"
              ><brew-icon name="bookmark" size="18"></brew-icon> Save</brew-button
            >
            <brew-button
              variant="outlined"
              full-width
              ?disabled="${!isValid}"
              @button-click="${() => openSaveDialog({ shareAfterSave: true })}"
              ><brew-icon .svg="${SHARE_ICON}" size="18"></brew-icon> Share</brew-button
            >
          </div>

          <brew-button
            variant="filled"
            full-width
            large
            ?disabled="${!isValid}"
            @button-click="${this._onStartGuidedTimer}"
            ><brew-icon name="timer" size="22"></brew-icon> Start guided timer</brew-button
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
                          .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
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
        ></brew-save-sheet>
      </div>
    `;
  }
}
