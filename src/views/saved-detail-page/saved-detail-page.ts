import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/bottom-sheet/brew-bottom-sheet";
import "../../components/brew-steps-card/brew-steps-card";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/link-card/brew-link-card";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/ratio-summary/brew-ratio-summary";
import "../../components/shot-list/brew-shot-list";
import "../../components/star-rating/brew-star-rating";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import "../../components/type-picker/brew-type-picker";
import "../../components/video-search/brew-video-search";
import { BREW_GUIDE } from "../../shared/data/brew-content.data";
import { BREW_STEPS_PRESETS } from "../../shared/data/brew-steps-presets.data";
import {
  ARROW_BACK_ICON_SVG,
  DELETE_ICON,
  EDIT_ICON,
  MENU_BOOK_ICON_SVG,
  REPLAY_ICON,
  SHARE_ICON,
} from "../../shared/icons/icons";
import type { IBrewStepsConfig, ISavedBrew } from "../../shared/interfaces/brew.interface";
import { getBrewTypeFeatures } from "../../shared/stores/brew-type-features.store";
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
import {
  brewAgain,
  deleteSavedBrew,
  savedBrewsSignal,
  updateSavedBrew,
} from "../../shared/stores/brew.store";
import { editBeforeBrewingIdSignal } from "../../shared/stores/post-save-sheet.store";
import { getShotsForBrew } from "../../shared/stores/shot.store";
import { BrewStepsViewToggleStyles } from "../../shared/styles/brew-steps-view-toggle.styles";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { BREW_ICON_MAP, normalizeBrewIconKey } from "../../shared/utilities/brew-icon.utility";
import {
  type BrewStepsViewMode,
  type RecipeSheetViewMode,
  renderBrewStepsViewToggle,
  resolveBrewStepsForMode,
} from "../../shared/utilities/brew-steps-view.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { coffeeForWater, gramsToOunces, ouncesToGrams } from "../../shared/utilities/ratio.utility";
import {
  type IRecipeModifiedCurrent,
  isRecipeModified,
} from "../../shared/utilities/recipe-modified.utility";
import {
  renderOriginalRecipeSheet,
  renderRecipeProvenanceBanner,
} from "../../shared/utilities/recipe-provenance.utility";
import { SHARE_OUTCOME_MESSAGES, shareBrew } from "../../shared/utilities/share.utility";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
import { SavedDetailPageStyles } from "./saved-detail-page.styles";

@customElement("saved-detail-page")
export class SavedDetailPage extends SignalWatcher(LitElement) {
  static styles = [SavedDetailPageStyles, BrewStepsViewToggleStyles, responsiveScreenStyles];

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
  @state() private _editBrewSteps: IBrewStepsConfig | null = null;
  @state() private _shareStatusText = "";
  @state() private _originalRecipeOpen = false;
  @state() private _confirmingDelete = false;
  /** Which version of `brew.brewSteps` the inline card shows - only relevant while `brew.recipeSource` is present. Defaults to today's plain behavior. */
  @state() private _stepsViewMode: BrewStepsViewMode = "modified";
  /** Which version the "see the original" sheet shows - defaults to today's plain behavior (the curated recipe card). */
  @state() private _originalRecipeViewMode: RecipeSheetViewMode = "original";

  private _statusTimeout: ReturnType<typeof setTimeout> | undefined;

  /**
   * Consumes a pending "Edit before brewing" request from the Post Save
   * Sheet (set via `requestEditBeforeBrewing` when "Brew again" was tapped
   * on this very screen) - reading the signal here, rather than only in
   * `render()`, still keeps it tracked by `SignalWatcher` (which wraps the
   * whole update lifecycle), while `willUpdate` is the safe place to also
   * set `@state` for this same render pass.
   */
  protected willUpdate(): void {
    const pendingId = editBeforeBrewingIdSignal.value;
    if (pendingId === null || this._editing) return;
    const brew = savedBrewsSignal.value.find((item) => item.id === pendingId);
    if (!brew || Number(this.routeParams.id) !== pendingId) return;
    editBeforeBrewingIdSignal.value = null;
    this._toggleEditing(brew);
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
    // A brew saved before this feature shipped has no `brewSteps` of its own -
    // fall back to the type's canned preset (if any), same as the
    // Calculator's own `primeCalculatorForBrew`.
    this._editBrewSteps = brew.brewSteps ?? BREW_STEPS_PRESETS[brew.brewType] ?? null;
    this._editing = true;
  }

  private _onSaveEdit(brew: ISavedBrew): void {
    const water = Number.parseFloat(this._editWater);
    const ratio = Number.parseFloat(this._editRatio);
    const coffee = coffeeForWater(water, ratio);
    if (coffee === null || !this._editBrewType) return;
    const oz = this._editOz ? Number.parseFloat(this._editOz) : gramsToOunces(water);
    /** A retyped brew that now has its own automatic icon match must drop any stale manual override from its old (custom) type. */
    const hasAutomaticIcon = Boolean(BREW_ICON_MAP[normalizeBrewIconKey(this._editBrewType)]);
    /** `recipeSource` is provenance for a specific loaded recipe - it's cleared, not edited, if the brew type changed away from the one it was loaded for. */
    const droppedRecipeType = Boolean(brew.recipeSource) && this._editBrewType !== brew.brewType;
    updateSavedBrew(brew.id, {
      brewType: this._editBrewType,
      name: this._editBrewName.trim() || undefined,
      water,
      ratio,
      coffee,
      oz,
      rating: this._editRating || undefined,
      tastingNote: this._editTastingNote.trim() || undefined,
      brewSteps: this._editBrewSteps ?? undefined,
      ...(hasAutomaticIcon ? { icon: undefined } : {}),
      ...(droppedRecipeType ? { recipeSource: undefined } : {}),
    });
    this._editing = false;
  }

  private _onDeleteClick = (): void => {
    this._confirmingDelete = true;
  };

  private _onCancelDelete = (): void => {
    this._confirmingDelete = false;
  };

  private _onConfirmDelete(id: number): void {
    this._confirmingDelete = false;
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
          <brew-top-bar
            title="Not found"
            .icon="${ARROW_BACK_ICON_SVG}"
            href="/saved"
          ></brew-top-bar>
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
    const recipeCurrent: IRecipeModifiedCurrent = {
      ratio: String(brew.ratio),
      water: String(brew.water),
      coffee: brew.coffee,
      steps: brew.brewSteps?.steps ?? [],
    };
    /** The toggle+diff-aware card only applies to an actually-modified recipe - an unmodified one has nothing to diff, so showing Modified/Original/Diff for it would just be a confusing no-op. */
    const isRecipeActuallyModified = brew.recipeSource
      ? isRecipeModified(recipeCurrent, brew.recipeSource)
      : false;
    const resolvedSteps =
      brew.recipeSource && isRecipeActuallyModified
        ? resolveBrewStepsForMode(brew.brewSteps, brew.recipeSource, this._stepsViewMode)
        : null;

    return html`
      <div class="screen">
        <brew-top-bar
          title="${getBrewDisplayName(brew)}"
          .icon="${ARROW_BACK_ICON_SVG}"
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
                    label="Tasting note(s)"
                    .value="${this._editTastingNote}"
                    @value-change="${(e: CustomEvent<string>) => {
                      this._editTastingNote = e.detail;
                    }}"
                  ></brew-text-field>

                  ${
                    this._editBrewSteps
                      ? html`
                          <brew-steps-card
                            editing
                            start-open
                            .config="${this._editBrewSteps}"
                            @config-change="${(e: CustomEvent<IBrewStepsConfig>) => {
                              this._editBrewSteps = e.detail;
                            }}"
                          ></brew-steps-card>
                        `
                      : nothing
                  }
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
                    @button-click="${() => this._onSaveEdit(brew)}"
                    >Save changes</brew-button
                  >
                `
              : html`
                  <brew-button
                    variant="filled"
                    full-width
                    large
                    @button-click="${() => brewAgain(brew, { alreadyOnDetail: true })}"
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
                      @button-click="${this._onDeleteClick}"
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
                  ${
                    brew.brewSteps
                      ? resolvedSteps
                        ? html`
                            ${renderBrewStepsViewToggle(this._stepsViewMode, (mode) => {
                              this._stepsViewMode = mode;
                            })}
                            <brew-steps-card
                              .config="${resolvedSteps.config}"
                              .diffAgainst="${resolvedSteps.diffAgainst}"
                            ></brew-steps-card>
                          `
                        : html`<brew-steps-card .config="${brew.brewSteps}"></brew-steps-card>`
                      : nothing
                  }
                  ${renderRecipeProvenanceBanner(brew.recipeSource, recipeCurrent, () => {
                    this._originalRecipeOpen = true;
                  })}
                  ${
                    isWebBluetoothSupported() && getBrewTypeFeatures(brew.brewType).showShotsSection
                      ? html`
                          <div class="section-title">
                            ${brew.brewType === "Espresso Shot" ? "Shots" : "Brews"}
                          </div>
                          <brew-shot-list
                            .shots="${getShotsForBrew(brew.id)}"
                            brew-type="${brew.brewType}"
                          ></brew-shot-list>
                        `
                      : nothing
                  }

                  <div class="section-title">Brew guide</div>
                  ${
                    matchingGuide
                      ? html`
                          <brew-link-card
                            href="/more/guide/${matchingGuide.id}"
                            .svg="${MENU_BOOK_ICON_SVG}"
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
        <brew-bottom-sheet
          ?open="${this._confirmingDelete}"
          label="Delete this saved brew?"
          @sheet-scrim-click="${this._onCancelDelete}"
        >
          <div class="title">Delete this saved brew?</div>
          <p class="hint">
            This permanently deletes "${getBrewDisplayName(brew)}" from your saved brews. This can't
            be undone.
          </p>
          <div class="actions">
            <brew-button variant="text" @button-click="${this._onCancelDelete}">Cancel</brew-button>
            <brew-button
              variant="filled"
              tone="danger"
              @button-click="${() => this._onConfirmDelete(brew.id)}"
              >Yes, delete</brew-button
            >
          </div>
        </brew-bottom-sheet>
        ${renderOriginalRecipeSheet(
          brew.recipeSource,
          this._originalRecipeOpen,
          () => {
            this._originalRecipeOpen = false;
          },
          recipeCurrent,
          this._originalRecipeViewMode,
          (mode) => {
            this._originalRecipeViewMode = mode;
          },
          { hideBrewButton: true },
        )}
      </div>
    `;
  }
}
