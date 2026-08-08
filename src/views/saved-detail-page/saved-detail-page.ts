import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/top-bar/brew-top-bar";
import "../../components/type-picker/brew-type-picker";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import { deleteSavedBrew, savedBrewsSignal, updateSavedBrew } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { coffeeForWater, gramsToOunces, ouncesToGrams } from "../../shared/utilities/ratio.utility";
import { SHARE_OUTCOME_MESSAGES, shareBrew } from "../../shared/utilities/share.utility";
import { SavedDetailPageStyles } from "./saved-detail-page.styles";

@customElement("saved-detail-page")
export class SavedDetailPage extends SignalWatcher(LitElement) {
  static styles = [SavedDetailPageStyles, responsiveScreenStyles];

  @property({ type: Object }) routeParams: Record<string, string | undefined> = {};

  @state() private _editing = false;
  @state() private _editBrewType = "";
  @state() private _editRatio = "";
  @state() private _editWater = "";
  @state() private _editOz = "";
  @state() private _editCoffee: number | null = null;
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

  private _onShare = async (brew: ISavedBrew): Promise<void> => {
    const outcome = await shareBrew(brew);
    this._showStatus(SHARE_OUTCOME_MESSAGES[outcome]);
  };

  /** Mirrors calculator.store.ts's setRatio/setWater/setOz linking, scoped to this brew's local edit state. */
  private _setEditRatio(value: string): void {
    const ratio = Number.parseFloat(value);
    const water = Number.parseFloat(this._editWater);
    this._editRatio = value;
    this._editCoffee = Number.isNaN(water) || !ratio ? null : coffeeForWater(water, ratio);
  }

  private _setEditWater(value: string): void {
    const grams = Number.parseFloat(value);
    const ratio = Number.parseFloat(this._editRatio);
    this._editWater = value;
    this._editOz = Number.isNaN(grams) ? "" : String(gramsToOunces(grams));
    this._editCoffee = Number.isNaN(grams) || !ratio ? null : coffeeForWater(grams, ratio);
  }

  private _setEditOz(value: string): void {
    const ounces = Number.parseFloat(value);
    const ratio = Number.parseFloat(this._editRatio);
    const grams = Number.isNaN(ounces) ? "" : String(ouncesToGrams(ounces));
    this._editOz = value;
    this._editWater = grams;
    this._editCoffee =
      grams === "" || !ratio ? null : coffeeForWater(Number.parseFloat(grams), ratio);
  }

  /** Toggling on seeds fresh from the saved brew; toggling off discards any unsaved edits. */
  private _toggleEditing(brew: ISavedBrew): void {
    if (this._editing) {
      this._editing = false;
      return;
    }
    this._editBrewType = brew.brewType;
    this._editRatio = String(brew.ratio);
    this._editWater = String(brew.water);
    this._editOz = String(brew.oz);
    this._editCoffee = brew.coffee;
    this._editing = true;
  }

  private _onSaveEdit(id: number): void {
    const water = Number.parseFloat(this._editWater);
    const ratio = Number.parseFloat(this._editRatio);
    const coffee = coffeeForWater(water, ratio);
    if (coffee === null || !this._editBrewType) return;
    const oz = this._editOz ? Number.parseFloat(this._editOz) : gramsToOunces(water);
    updateSavedBrew(id, { brewType: this._editBrewType, water, ratio, coffee, oz });
    this._editing = false;
  }

  private _onDelete(id: number): void {
    deleteSavedBrew(id);
    navigateTo("/saved");
  }

  private _onTypeAdd = (event: CustomEvent<string>): void => {
    const added = addCustomBrewType(event.detail);
    if (added) this._editBrewType = added;
  };

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

    const canSaveEdit = Boolean(
      this._editBrewType && this._editWater && this._editOz && this._editCoffee !== null,
    );

    return html`
      <div class="screen">
        <brew-top-bar title="${brew.brewType}" icon="arrow_back" href="/saved"></brew-top-bar>

        <div class="content">
          ${
            this._editing
              ? html`
                  <div class="field-label">Brew type</div>
                  <brew-type-picker
                    .types="${allBrewTypesSignal.value}"
                    selected="${this._editBrewType}"
                    @type-select="${(e: CustomEvent<string>) => {
                      this._editBrewType = e.detail;
                    }}"
                    @type-add="${this._onTypeAdd}"
                  ></brew-type-picker>

                  <brew-ratio-form
                    ratio="${this._editRatio}"
                    water="${this._editWater}"
                    oz="${this._editOz}"
                    .coffee="${this._editCoffee}"
                    @ratio-change="${(e: CustomEvent<string>) => this._setEditRatio(e.detail)}"
                    @water-change="${(e: CustomEvent<string>) => this._setEditWater(e.detail)}"
                    @oz-change="${(e: CustomEvent<string>) => this._setEditOz(e.detail)}"
                  ></brew-ratio-form>
                `
              : html`
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
                `
          }

          <brew-button
            variant="filled"
            full-width
            ?disabled="${this._editing && !canSaveEdit}"
            @button-click="${() =>
              this._editing ? this._onSaveEdit(brew.id) : this._toggleEditing(brew)}"
            >${this._editing ? "Save changes" : "Edit ratio"}</brew-button
          >

          ${
            this._editing
              ? null
              : html`
                  <brew-button
                    variant="outlined"
                    full-width
                    @button-click="${() => this._onShare(brew)}"
                    >Share ratio</brew-button
                  >
                  ${
                    this._shareStatusText
                      ? html`<p class="share-status">${this._shareStatusText}</p>`
                      : null
                  }
                `
          }

          <button class="delete-link" type="button" @click="${() => this._onDelete(brew.id)}">
            Delete ratio
          </button>
        </div>

        <brew-bottom-nav active="saved"></brew-bottom-nav>
      </div>
    `;
  }
}
