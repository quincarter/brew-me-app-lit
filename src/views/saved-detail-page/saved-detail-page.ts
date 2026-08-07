import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import {
  deleteSavedBrew,
  getSavedBrewById,
  savedBrewsSignal,
  updateSavedBrew,
} from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { coffeeForWater, gramsToOunces } from "../../shared/utilities/ratio.utility";
import { SavedDetailPageStyles } from "./saved-detail-page.styles";

@customElement("saved-detail-page")
export class SavedDetailPage extends SignalWatcher(LitElement) {
  static styles = [SavedDetailPageStyles, responsiveScreenStyles];

  @property({ type: Object }) routeParams: Record<string, string | undefined> = {};

  @state() private _editWater = "";
  @state() private _editRatio = "";
  @state() private _initializedForId: number | null = null;

  protected willUpdate(): void {
    const id = Number(this.routeParams.id);
    const brew = getSavedBrewById(id);
    if (brew && this._initializedForId !== id) {
      this._editWater = String(brew.water);
      this._editRatio = String(brew.ratio);
      this._initializedForId = id;
    }
  }

  private _onSaveEdit(id: number): void {
    const water = Number.parseFloat(this._editWater);
    const ratio = Number.parseFloat(this._editRatio);
    const coffee = coffeeForWater(water, ratio);
    if (coffee === null) return;
    updateSavedBrew(id, { water, ratio, coffee, oz: gramsToOunces(water) });
  }

  private _onDelete(id: number): void {
    deleteSavedBrew(id);
    navigateTo("/saved");
  }

  render(): HTMLTemplateResult {
    // Read the signal so this view re-renders after edits/deletes.
    const brews = savedBrewsSignal.value;
    const id = Number(this.routeParams.id);
    const brew = brews.find((item) => item.id === id);

    if (!brew) {
      return html`
        <div class="screen">
          <brew-top-bar title="Not found" icon="arrow_back" href="/saved"></brew-top-bar>
          <div class="content"><p>This saved ratio no longer exists.</p></div>
          <brew-bottom-nav active="saved"></brew-bottom-nav>
        </div>
      `;
    }

    return html`
      <div class="screen">
        <brew-top-bar title="${brew.brewType}" icon="arrow_back" href="/saved"></brew-top-bar>

        <div class="content">
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

          <div class="edit-fields">
            <brew-text-field
              label="Water (g)"
              type="number"
              .value="${this._editWater}"
              @value-change="${(e: CustomEvent<string>) => {
                this._editWater = e.detail;
              }}"
            ></brew-text-field>
            <brew-text-field
              label="Ratio"
              type="number"
              suffix-text=":1"
              .value="${this._editRatio}"
              @value-change="${(e: CustomEvent<string>) => {
                this._editRatio = e.detail;
              }}"
            ></brew-text-field>
          </div>

          <brew-button
            variant="filled"
            full-width
            @button-click="${() => this._onSaveEdit(brew.id)}"
            >Save changes</brew-button
          >
          <button class="delete-link" type="button" @click="${() => this._onDelete(brew.id)}">
            Delete ratio
          </button>
        </div>

        <brew-bottom-nav active="saved"></brew-bottom-nav>
      </div>
    `;
  }
}
