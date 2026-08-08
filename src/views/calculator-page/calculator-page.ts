import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import { recentSavedBrewsSignal } from "../../shared/stores/brew.store";
import {
  coffeeSignal,
  ozSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  waterSignal,
} from "../../shared/stores/calculator.store";
import { openSaveDialog } from "../../shared/stores/save-dialog.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import {
  getAvatarColors,
  getInitial,
} from "../../shared/utilities/avatar-palette.utility";
import {
  SHARE_OUTCOME_MESSAGES,
  shareBrew,
} from "../../shared/utilities/share.utility";
import { CalculatorPageStyles } from "./calculator-page.styles";

/** Placeholder brew type for a share sent straight from the calculator, before it's been named/saved. */
const UNSAVED_BREW_TYPE = "Custom Ratio";

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

  private _onShare = async (): Promise<void> => {
    const coffee = coffeeSignal.value;
    const water = Number.parseFloat(waterSignal.value);
    const oz = Number.parseFloat(ozSignal.value);
    const ratio = Number.parseFloat(ratioSignal.value);
    if (coffee === null || Number.isNaN(water) || Number.isNaN(oz)) return;

    const outcome = await shareBrew({
      brewType: UNSAVED_BREW_TYPE,
      ratio,
      water,
      coffee,
      oz,
    });
    this._showStatus(SHARE_OUTCOME_MESSAGES[outcome]);
  };

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
            <brew-button
              variant="outlined"
              full-width
              @button-click="${resetCalculator}"
              >Reset</brew-button
            >
            <brew-button
              variant="filled"
              full-width
              ?disabled="${!isValid}"
              @button-click="${openSaveDialog}"
              >Save ratio</brew-button
            >
          </div>

          <brew-button
            variant="text"
            full-width
            ?disabled="${!isValid}"
            @button-click="${this._onShare}"
            >Share this brew</brew-button
          >
          ${this._shareStatusText
            ? html`<p class="share-status">${this._shareStatusText}</p>`
            : null}

          <div class="ratio-tips">
            <div class="ratio-tips-header">
              <brew-icon name="info" size="20"></brew-icon>
              <span class="ratio-tips-title">Ratio tips</span>
            </div>
            <p class="ratio-tips-body">
              Lower ratio = stronger, more intense brew.
            </p>
            <p class="ratio-tips-body">Higher ratio = weaker, lighter cup.</p>
            <p class="ratio-tips-body">
              As always - Adjust to taste. If it tastes good, the math and
              numbers are just numbers.
            </p>
            <span class="ratio-tips-body">Brew Examples</span>
            <ul class="ratio-tips-body">
              <li>Pour-over/drip: 15–18:1</li>
              <li>Espresso: ~2:1</li>
              <li>Cold brew: 3–5:1.</li>
            </ul>
          </div>

          ${recentBrews.length > 0
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
                        brew-type="${brew.brewType}"
                        ratio="${brew.ratio}"
                        coffee="${brew.coffee}"
                        water="${brew.water}"
                        oz="${brew.oz}"
                        avatar-initial="${getInitial(brew.brewType)}"
                        avatar-bg="${colors.background}"
                        avatar-fg="${colors.foreground}"
                      ></brew-saved-card>
                    `;
                  })}
                </div>
              `
            : null}
        </div>

        <brew-bottom-nav active="calculate"></brew-bottom-nav>
        <brew-save-sheet></brew-save-sheet>
      </div>
    `;
  }
}
