import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/empty-state/brew-empty-state";
import "../../components/link-card/brew-link-card";
import "../../components/top-bar/brew-top-bar";
import "../../components/video-search/brew-video-search";

import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import type { IShareableBrew } from "../../shared/interfaces/brew.interface";
import { addSavedBrew, savedBrewsSignal } from "../../shared/stores/brew.store";
import { primeCalculatorForBrew } from "../../shared/stores/calculator.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import {
  SHARE_OUTCOME_MESSAGES,
  parseShareParams,
  shareBrew,
} from "../../shared/utilities/share.utility";
import { BrewSharePageStyles } from "./brew-share-page.styles";

/**
 * Read-only landing screen for a `/share?brewType=...&ratio=...` link -
 * `@lit-labs/router` only hands views their *path* params, so the query
 * string is parsed straight off `window.location.search` on connect
 * instead of via `routeParams`.
 */
@customElement("brew-share-page")
export class BrewSharePage extends SignalWatcher(LitElement) {
  static styles = [BrewSharePageStyles, responsiveScreenStyles];

  @state() private _brew: IShareableBrew | null = null;
  @state() private _justSaved = false;
  @state() private _shareStatusText = "";

  private _statusTimeout: ReturnType<typeof setTimeout> | undefined;

  connectedCallback(): void {
    super.connectedCallback();
    this._brew = parseShareParams(window.location.search);
  }

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

  private _onOpenInCalculator(brew: IShareableBrew): void {
    primeCalculatorForBrew(brew);
    navigateTo("/calculate");
  }

  private _onSave(brew: IShareableBrew): void {
    addSavedBrew(brew);
    this._justSaved = true;
  }

  private _onShare = async (brew: IShareableBrew): Promise<void> => {
    const outcome = await shareBrew(brew);
    this._showStatus(SHARE_OUTCOME_MESSAGES[outcome]);
  };

  render(): HTMLTemplateResult {
    const brew = this._brew;

    if (!brew) {
      return html`
        <div class="screen">
          <brew-top-bar title="Shared Brew"></brew-top-bar>
          <div class="content">
            <brew-empty-state
              message="This share link is missing or damaged - the brew's numbers didn't come through."
              cta-label="Go to Calculator"
              cta-href="/calculate"
            ></brew-empty-state>
          </div>
          <brew-bottom-nav></brew-bottom-nav>
        </div>
      `;
    }

    const alreadySaved = savedBrewsSignal.value.some(
      (saved) =>
        saved.brewType === brew.brewType &&
        saved.ratio === brew.ratio &&
        saved.water === brew.water &&
        saved.coffee === brew.coffee &&
        saved.oz === brew.oz,
    );
    const isSaved = this._justSaved || alreadySaved;
    const matchingGuide = BREW_GUIDE.find((item) => item.name === brew.brewType);

    return html`
      <div class="screen">
        <brew-top-bar title="${getBrewDisplayName(brew)}"></brew-top-bar>

        <div class="content">
          <div class="eyebrow">Shared brew ratio</div>
          ${brew.name ? html`<div class="brew-type-subtitle">${brew.brewType}</div>` : null}

          <div class="ratio-hero">
            <div class="ratio-label">Ratio</div>
            <div class="ratio-value">${brew.ratio}:1</div>
          </div>

          <div class="stat-row">
            <div class="stat">
              <div class="stat-value">${brew.coffee}g</div>
              <div class="stat-label">coffee</div>
            </div>
            <div class="stat">
              <div class="stat-value">${brew.water}g</div>
              <div class="stat-label">water</div>
            </div>
            <div class="stat">
              <div class="stat-value">${brew.oz}oz</div>
              <div class="stat-label">cup size</div>
            </div>
          </div>

          <div class="actions">
            <brew-button
              variant="filled"
              full-width
              @button-click="${() => this._onOpenInCalculator(brew)}"
              >Open in Calculator</brew-button
            >
            <brew-button
              variant="outlined"
              full-width
              ?disabled="${isSaved}"
              @button-click="${() => this._onSave(brew)}"
              >${isSaved ? "Saved to your brews" : "Save to my brews"}</brew-button
            >
            <brew-button variant="text" full-width @button-click="${() => this._onShare(brew)}"
              >Share this brew</brew-button
            >
          </div>

          ${
            this._shareStatusText
              ? html`<p class="share-status">${this._shareStatusText}</p>`
              : null
          }

          <div class="section-title">Brew guide</div>
          ${
            matchingGuide
              ? html`
                  <brew-link-card
                    href="/more/guide/${matchingGuide.id}"
                    icon="menu_book"
                    label="${matchingGuide.name} Brew Guide"
                    description="Ratio tips, grind size, and video walkthroughs"
                  ></brew-link-card>
                `
              : html` <brew-video-search query="${brew.brewType} Brew Guide"></brew-video-search> `
          }
        </div>

        <brew-bottom-nav></brew-bottom-nav>
      </div>
    `;
  }
}
