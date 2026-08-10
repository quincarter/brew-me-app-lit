import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/link-card/brew-link-card";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/ratio-summary/brew-ratio-summary";
import "../../components/star-rating/brew-star-rating";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import "../../components/type-picker/brew-type-picker";
import "../../components/video-search/brew-video-search";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import { deleteSavedBrew, savedBrewsSignal, updateSavedBrew } from "../../shared/stores/brew.store";
import { brewAgain } from "../../shared/stores/calculator.store";
import { DELETE_ICON, EDIT_ICON, REPLAY_ICON, SHARE_ICON } from "../../shared/icons/icons";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { BREW_ICON_MAP, normalizeBrewIconKey } from "../../shared/utilities/brew-icon.utility";
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
  @state() private _editBrewName = "";
  @state() private _editRatio = "";
  @state() private _editWater = "";
  @state() private _editOz = "";
  @state() private _editCoffee: number | null = null;
  @state() private _editRating = 0;
  @state() private _editTastingNote = "";
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
    this._editBrewName = brew.name ?? "";
    this._editRatio = String(brew.ratio);
    this._editWater = String(brew.water);
    this._editOz = String(brew.oz);
    this._editCoffee = brew.coffee;
    this._editRating = brew.rating ?? 0;
    this._editTastingNote = brew.tastingNote ?? "";
    this._editing = true;
  }

  private _onSaveEdit(id: number): void {
    const water = Number.parseFloat(this._editWater);
    const ratio = Number.parseFloat(this._editRatio);
    const coffee = coffeeForWater(water, ratio);
    if (coffee === null || !this._editBrewType) return;
    const oz = this._editOz ? Number.parseFloat(this._editOz) : gramsToOunces(water);
    /** A retyped brew that now has its own automatic icon match must drop any stale manual override from its old (custom) type. */
    const hasAutomaticIcon = Boolean(BREW_ICON_MAP[normalizeBrewIconKey(this._editBrewType)]);
    updateSavedBrew(id, {
      brewType: this._editBrewType,
      name: this._editBrewName.trim() || undefined,
      water,
      ratio,
      coffee,
      oz,
      rating: this._editRating || undefined,
      tastingNote: this._editTastingNote.trim() || undefined,
      ...(hasAutomaticIcon ? { icon: undefined } : {}),
    });
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
    /** No match means a custom brew type - there's no curated guide to link to. */
    const matchingGuide = BREW_GUIDE.find((item) => item.name === brew.brewType);

    return html`
      <div class="screen">
        <brew-top-bar
          title="${getBrewDisplayName(brew)}"
          icon="arrow_back"
          href="/saved"
        ></brew-top-bar>

        <div class="content">
          ${
            this._editing
              ? html`
                  <brew-text-field
                    label="Brew name"
                    .value="${this._editBrewName}"
                    @value-change="${(e: CustomEvent<string>) => {
                      this._editBrewName = e.detail;
                    }}"
                  ></brew-text-field>

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

                  <div class="field-label">Rating</div>
                  <brew-star-rating
                    editable
                    .value="${this._editRating}"
                    @rating-change="${(e: CustomEvent<number>) => {
                      this._editRating = e.detail;
                    }}"
                  ></brew-star-rating>

                  <brew-text-field
                    label="Tasting note"
                    .value="${this._editTastingNote}"
                    @value-change="${(e: CustomEvent<string>) => {
                      this._editTastingNote = e.detail;
                    }}"
                  ></brew-text-field>
                `
              : html`
                  <brew-ratio-summary
                    ratio="${brew.ratio}"
                    coffee="${brew.coffee}"
                    water="${brew.water}"
                    oz="${brew.oz}"
                  ></brew-ratio-summary>

                  <div class="rating">
                    <brew-star-rating
                      editable
                      .value="${brew.rating ?? 0}"
                      @rating-change="${(e: CustomEvent<number>) =>
                        updateSavedBrew(brew.id, {
                          rating: e.detail || undefined,
                        })}"
                    ></brew-star-rating>
                    ${
                      brew.tastingNote
                        ? html`<p class="tasting-note">"${brew.tastingNote}"</p>`
                        : null
                    }
                  </div>
                `
          }
          ${
            this._editing
              ? html`
                  <brew-button
                    variant="filled"
                    full-width
                    ?disabled="${!canSaveEdit}"
                    @button-click="${() => this._onSaveEdit(brew.id)}"
                    >Save changes</brew-button
                  >
                `
              : html`
                  <brew-button
                    variant="filled"
                    full-width
                    large
                    @button-click="${() => brewAgain(brew)}"
                    ><brew-icon .svg="${REPLAY_ICON}" size="22"></brew-icon> Brew again</brew-button
                  >

                  <div class="action-row">
                    <brew-button
                      variant="outlined"
                      full-width
                      @button-click="${() => this._toggleEditing(brew)}"
                      ><brew-icon .svg="${EDIT_ICON}" size="18"></brew-icon> Edit</brew-button
                    >
                    <brew-button
                      variant="outlined"
                      full-width
                      @button-click="${() => this._onShare(brew)}"
                      ><brew-icon .svg="${SHARE_ICON}" size="18"></brew-icon> Share</brew-button
                    >
                    <brew-button
                      variant="outlined"
                      tone="danger"
                      full-width
                      @button-click="${() => this._onDelete(brew.id)}"
                      ><brew-icon .svg="${DELETE_ICON}" size="18"></brew-icon> Delete</brew-button
                    >
                  </div>

                  ${
                    this._shareStatusText
                      ? html`<p class="share-status">${this._shareStatusText}</p>`
                      : null
                  }
                `
          }
          ${
            this._editing
              ? null
              : html`
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
                      : html`
                          <brew-video-search
                            query="${brew.brewType} Brew Guide"
                          ></brew-video-search>
                        `
                  }
                `
          }
        </div>

        <brew-bottom-nav active="saved"></brew-bottom-nav>
      </div>
    `;
  }
}
