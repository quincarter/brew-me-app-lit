import { SignalWatcher } from "@lit-labs/preact-signals";
import { html, LitElement, nothing, type HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/bottom-sheet/brew-bottom-sheet";
import "../../components/brew-steps-card/brew-steps-card";
import "../../components/button/brew-button";
import "../../components/icon-button/brew-icon-button";
import "../../components/icon/brew-icon";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/recipe-card/brew-recipe-card";
import "../../components/recipe-picker-sheet/brew-recipe-picker-sheet";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import "../../components/type-picker/brew-type-picker";
import { AEROPRESS_RECIPES } from "../../shared/data/aeropress-recipes.data";
import { CHEMEX_RECIPES } from "../../shared/data/chemex-recipes.data";
import { CLEVER_DRIPPER_RECIPES } from "../../shared/data/clever-dripper-recipes.data";
import { HARIO_SWITCH_RECIPES } from "../../shared/data/hario-switch-recipes.data";
import { KALITA_WAVE_RECIPES } from "../../shared/data/kalita-wave-recipes.data";
import { ORIGAMI_RECIPES } from "../../shared/data/origami-recipes.data";
import { V60_RECIPES } from "../../shared/data/v60-recipes.data";
import { REFRESH_ICON, SHARE_ICON } from "../../shared/icons/icons";
import type {
  IAeropressRecipe,
  IBrewStepsConfig,
  IChemexRecipe,
  ICleverDripperRecipe,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  IOrigamiRecipe,
  ISavedBrew,
  IV60Recipe,
} from "../../shared/interfaces/brew.interface";
import {
  brewStepsSignal,
  loadAeropressRecipeIntoCalculator,
  loadChemexRecipeIntoCalculator,
  loadCleverDripperRecipeIntoCalculator,
  loadHarioSwitchRecipeIntoCalculator,
  loadKalitaWaveRecipeIntoCalculator,
  loadOrigamiRecipeIntoCalculator,
  loadV60RecipeIntoCalculator,
  loadedRecipeSourceSignal,
  QUICK_CALCULATOR,
  reopenBrewTypeChooser,
  resetBrewStepsToPreset,
  selectBrewType,
  selectedBrewTypeSignal,
  updateBrewStepsConfig,
} from "../../shared/stores/brew-steps.store";
import {
  addCustomBrewType,
  allBrewTypesSignal,
} from "../../shared/stores/brew-types.store";
import {
  brewAgain,
  recentSavedBrewsSignal,
} from "../../shared/stores/brew.store";
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
import {
  getAvatarColors,
  getInitial,
} from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import { isRecipeModified } from "../../shared/utilities/recipe-modified.utility";
import {
  SHARE_OUTCOME_MESSAGES,
  type ShareOutcome,
} from "../../shared/utilities/share.utility";
import { CalculatorPageStyles } from "./calculator-page.styles";

@customElement("calculator-page")
export class CalculatorPage extends SignalWatcher(LitElement) {
  static styles = [CalculatorPageStyles, responsiveScreenStyles];

  @state() private _shareStatusText = "";
  @state() private _stepsEditing = false;
  @state() private _recipePickerOpen = false;
  @state() private _originalRecipeOpen = false;

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

  private _onChooserTypeAdd = (event: CustomEvent<string>): void => {
    const added = addCustomBrewType(event.detail);
    if (added) selectBrewType(added);
  };

  private _onChangeType = (): void => {
    // A lighter reset than resetCalculator() - just re-opens the chooser,
    // leaving any entered numbers alone.
    reopenBrewTypeChooser();
  };

  private _onRecipeSelect = (
    event: CustomEvent<
      | IAeropressRecipe
      | IV60Recipe
      | IOrigamiRecipe
      | IKalitaWaveRecipe
      | IChemexRecipe
      | ICleverDripperRecipe
      | IHarioSwitchRecipe
    >,
  ): void => {
    const selectedType = selectedBrewTypeSignal.value;
    if (selectedType === "Aeropress") {
      loadAeropressRecipeIntoCalculator(event.detail as IAeropressRecipe);
    } else if (selectedType === "V60") {
      loadV60RecipeIntoCalculator(event.detail as IV60Recipe);
    } else if (selectedType === "Origami") {
      loadOrigamiRecipeIntoCalculator(event.detail as IOrigamiRecipe);
    } else if (selectedType === "Kalita Wave") {
      loadKalitaWaveRecipeIntoCalculator(event.detail as IKalitaWaveRecipe);
    } else if (selectedType === "Chemex") {
      loadChemexRecipeIntoCalculator(event.detail as IChemexRecipe);
    } else if (selectedType === "Clever Dripper" || selectedType === "Clever") {
      loadCleverDripperRecipeIntoCalculator(event.detail as ICleverDripperRecipe);
    } else if (selectedType === "Hario Switch" || selectedType === "Switch") {
      loadHarioSwitchRecipeIntoCalculator(event.detail as IHarioSwitchRecipe);
    }
    this._recipePickerOpen = false;
  };

  private _renderChooser(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar title="Calculator"></brew-top-bar>
        <div class="content">
          <p class="chooser-intro">What are you brewing?</p>
          <brew-button
            variant="filled"
            full-width
            large
            data-tour="quick-calculator-button"
            @button-click="${() => selectBrewType(QUICK_CALCULATOR)}"
            ><brew-icon name="calculate" size="18"></brew-icon> Quick
            calculator</brew-button
          >

          <div class="chooser-divider"><span>or pick a method</span></div>

          <brew-type-picker
            .types="${allBrewTypesSignal.value}"
            selected=""
            @type-select="${(e: CustomEvent<string>) =>
              selectBrewType(e.detail)}"
            @type-add="${this._onChooserTypeAdd}"
          ></brew-type-picker>
        </div>
        <brew-bottom-nav active="calculate"></brew-bottom-nav>
      </div>
    `;
  }

  private _renderRecipeBanner(): HTMLTemplateResult | typeof nothing {
    const source = loadedRecipeSourceSignal.value;
    if (!source) return nothing;

    const modified = isRecipeModified(
      {
        ratio: ratioSignal.value,
        water: waterSignal.value,
        coffee: coffeeSignal.value,
        steps: brewStepsSignal.value?.steps ?? [],
      },
      source,
    );

    return html`
      <button
        class="primed-banner recipe-banner"
        type="button"
        @click="${() => {
          this._originalRecipeOpen = true;
        }}"
      >
        <brew-icon name="menu_book" size="18"></brew-icon>
        <span class="primed-banner-text"
          >${modified
            ? html`Modified from ${source.label} — tap to see the original`
            : html`Pulled from ${source.label}`}</span
        >
      </button>
    `;
  }

  private _renderOriginalRecipeSheet(): HTMLTemplateResult | typeof nothing {
    const source = loadedRecipeSourceSignal.value;
    if (!this._originalRecipeOpen || !source) return nothing;
    const aeroOriginal = AEROPRESS_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const v60Original = V60_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const origamiOriginal = ORIGAMI_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const kalitaOriginal = KALITA_WAVE_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const chemexOriginal = CHEMEX_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const cleverOriginal = CLEVER_DRIPPER_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );
    const switchOriginal = HARIO_SWITCH_RECIPES.find(
      (recipe) => recipe.id === source.recipeId,
    );

    return html`
      <brew-bottom-sheet
        open
        label="Original recipe"
        @sheet-scrim-click="${() => {
          this._originalRecipeOpen = false;
        }}"
      >
        <div class="title">Original recipe</div>
        ${aeroOriginal
          ? html`<brew-recipe-card
              .recipe="${aeroOriginal}"
              start-open
            ></brew-recipe-card>`
          : v60Original
            ? html`<brew-pourover-recipe-card
                .recipe="${v60Original}"
                start-open
              ></brew-pourover-recipe-card>`
            : origamiOriginal
              ? html`<brew-pourover-recipe-card
                  .recipe="${origamiOriginal}"
                  start-open
                ></brew-pourover-recipe-card>`
              : kalitaOriginal
                ? html`<brew-pourover-recipe-card
                    .recipe="${kalitaOriginal}"
                    start-open
                  ></brew-pourover-recipe-card>`
                : chemexOriginal
                  ? html`<brew-pourover-recipe-card
                      .recipe="${chemexOriginal}"
                      start-open
                    ></brew-pourover-recipe-card>`
                  : cleverOriginal
                    ? html`<brew-pourover-recipe-card
                        .recipe="${cleverOriginal}"
                        start-open
                      ></brew-pourover-recipe-card>`
                    : switchOriginal
                      ? html`<brew-pourover-recipe-card
                          .recipe="${switchOriginal}"
                          start-open
                        ></brew-pourover-recipe-card>`
                      : html`<p>This recipe is no longer available.</p>`}
      </brew-bottom-sheet>
    `;
  }

  render(): HTMLTemplateResult {
    const selectedType = selectedBrewTypeSignal.value;
    const regexVowels = /^[aeiou]/i;
    if (selectedType === null) return this._renderChooser();

    const coffee = coffeeSignal.value;
    const water = waterSignal.value;
    const oz = ozSignal.value;
    const isValid = Boolean(water && oz && coffee);
    const recentBrews = recentSavedBrewsSignal.value;
    const isQuickCalculator = selectedType === QUICK_CALCULATOR;
    const brewSteps = isQuickCalculator ? null : brewStepsSignal.value;
    const hasCuratedRecipes =
      selectedType === "Aeropress" ||
      selectedType === "V60" ||
      selectedType === "Origami" ||
      selectedType === "Kalita Wave" ||
      selectedType === "Chemex" ||
      selectedType === "Clever Dripper" ||
      selectedType === "Clever" ||
      selectedType === "Hario Switch" ||
      selectedType === "Switch";

    return html`
      <div class="screen">
        <brew-top-bar title="Calculator"></brew-top-bar>

        <div class="content">
          ${primedFromNameSignal.value
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
            : nothing}
          ${isQuickCalculator
            ? nothing
            : html`
                <div class="type-chip-row">
                  <span class="type-chip">${selectedType}</span>
                  <brew-button
                    variant="text"
                    @button-click="${this._onChangeType}"
                    >Change</brew-button
                  >
                </div>
              `}
          ${isQuickCalculator ? nothing : this._renderRecipeBanner()}

          <brew-ratio-form
            ratio="${ratioSignal.value}"
            water="${water}"
            oz="${oz}"
            .coffee="${coffee}"
            @ratio-change="${(e: CustomEvent<string>) => setRatio(e.detail)}"
            @water-change="${(e: CustomEvent<string>) => setWater(e.detail)}"
            @oz-change="${(e: CustomEvent<string>) => setOz(e.detail)}"
          ></brew-ratio-form>

          ${brewSteps
            ? html`
                <brew-steps-card
                  .config="${brewSteps}"
                  ?editing="${this._stepsEditing}"
                  @config-change="${(e: CustomEvent<IBrewStepsConfig>) =>
                    updateBrewStepsConfig(e.detail)}"
                  @reset-to-preset="${resetBrewStepsToPreset}"
                >
                  <brew-button
                    slot="actions"
                    variant="text"
                    @button-click="${() => {
                      this._stepsEditing = !this._stepsEditing;
                    }}"
                    >${this._stepsEditing ? "Done" : "Edit"}</brew-button
                  >
                </brew-steps-card>
              `
            : nothing}

          <div class="row actions">
            <brew-button
              variant="outlined"
              full-width
              @button-click="${resetCalculator}"
              ><brew-icon .svg=${REFRESH_ICON} size="18"></brew-icon>
              Reset</brew-button
            >
            <brew-button
              variant="outlined"
              full-width
              ?disabled="${!isValid}"
              @button-click="${() => openSaveDialog({ intent: "share" })}"
              ><brew-icon .svg=${SHARE_ICON} size="18"></brew-icon>
              Share</brew-button
            >
          </div>
          <brew-button
            variant="outlined"
            full-width
            ?disabled="${!isValid}"
            @button-click="${() => openSaveDialog({ intent: "guided-timer" })}"
            ><brew-icon name="timer" size="22"></brew-icon> Start guided
            timer</brew-button
          >
          <brew-button
            variant="filled"
            full-width
            large
            ?disabled="${!isValid}"
            @button-click="${openSaveDialog}"
            ><brew-icon name="bookmark" size="18"></brew-icon> Save</brew-button
          >
          ${this._shareStatusText
            ? html`<p class="share-status">${this._shareStatusText}</p>`
            : null}
          ${hasCuratedRecipes
            ? html`
                <brew-button
                  variant="outlined"
                  full-width
                  @button-click="${() => {
                    this._recipePickerOpen = true;
                  }}"
                  ><brew-icon name="menu_book" size="18"></brew-icon>
                  ${selectedType === "Aeropress"
                    ? "Load a WAC recipe"
                    : `Load ${regexVowels.test(selectedType.toLowerCase()) ? "an" : "a"} ${selectedType} barista recipe`}</brew-button
                >
              `
            : nothing}

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
              <li>Pour-over/drip: 1:15–18</li>
              <li>Espresso: 1:2</li>
              <li>Cold brew: 1:3–5</li>
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
                        brew-type="${getBrewDisplayName(brew)}"
                        ratio="${brew.ratio}"
                        coffee="${brew.coffee}"
                        water="${brew.water}"
                        oz="${brew.oz}"
                        avatar-initial="${getInitial(getBrewDisplayName(brew))}"
                        avatar-bg="${colors.background}"
                        avatar-fg="${colors.foreground}"
                        .avatarIcon="${getBrewTypeIcon(
                          brew.brewType,
                          brew.icon,
                        ) ?? null}"
                        rating="${brew.rating ?? 0}"
                        ?replayable="${true}"
                        @replay-click="${() => brewAgain(brew)}"
                      ></brew-saved-card>
                    `;
                  })}
                </div>
              `
            : null}
        </div>

        <brew-bottom-nav active="calculate"></brew-bottom-nav>
        <brew-save-sheet
          @brew-share-outcome="${(e: CustomEvent<ShareOutcome>) =>
            this._showStatus(SHARE_OUTCOME_MESSAGES[e.detail])}"
          @brew-saved="${(e: CustomEvent<ISavedBrew>) =>
            openPostSaveSheet(e.detail)}"
          @brew-guided-timer-ready="${(e: CustomEvent<ISavedBrew>) => {
            primeTimerForSavedBrew(e.detail);
            navigateTo("/timer");
          }}"
        ></brew-save-sheet>
        ${isQuickCalculator
          ? nothing
          : html`
              <brew-recipe-picker-sheet
                brew-type="${selectedType}"
                ?open="${this._recipePickerOpen}"
                @recipe-select="${this._onRecipeSelect}"
                @sheet-scrim-click="${() => {
                  this._recipePickerOpen = false;
                }}"
              ></brew-recipe-picker-sheet>
              ${this._renderOriginalRecipeSheet()}
            `}
      </div>
    `;
  }
}
