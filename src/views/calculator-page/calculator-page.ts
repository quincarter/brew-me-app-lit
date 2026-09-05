import { SignalWatcher } from "@lit-labs/preact-signals";
import { html, LitElement, nothing, type HTMLTemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/brew-steps-card/brew-steps-card";
import "../../components/button/brew-button";
import "../../components/espresso-calculator/brew-espresso-calculator";
import "../../components/icon-button/brew-icon-button";
import "../../components/icon/brew-icon";
import "../../components/ratio-form/brew-ratio-form";
import "../../components/recipe-picker-sheet/brew-recipe-picker-sheet";
import "../../components/save-sheet/brew-save-sheet";
import "../../components/saved-card/brew-saved-card";
import "../../components/top-bar/brew-top-bar";
import "../../components/type-picker/brew-type-picker";
import {
  CALCULATE_ICON_SVG,
  CLOSE_ICON,
  INFO_ICON_SVG,
  MENU_BOOK_ICON_SVG,
  REFRESH_ICON,
  REPLAY_ICON,
  SAVED_ICON_SVG,
  SHARE_ICON,
  TIMER_ICON_SVG,
} from "../../shared/icons/icons";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
  IBrewStepsConfig,
  IChemexRecipe,
  ICleverDripperRecipe,
  IEspressoProfile,
  IEspressoShotStyle,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  IOrigamiRecipe,
  ISavedBrew,
  IV60Recipe,
} from "../../shared/interfaces/brew.interface";
import {
  brewStepsSignal,
  loadAeropressExpertRecipeIntoCalculator,
  loadAeropressRecipeIntoCalculator,
  loadChemexRecipeIntoCalculator,
  loadCleverDripperRecipeIntoCalculator,
  loadEspressoProfileIntoCalculator,
  loadEspressoShotStyleIntoCalculator,
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
import { addCustomBrewType, allBrewTypesSignal } from "../../shared/stores/brew-types.store";
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
import {
  espressoDoseInSignal,
  espressoDoseOutSignal,
  espressoRatioSignal,
  resetEspressoCalculator,
  setEspressoDoseIn,
  setEspressoDoseOut,
  setEspressoRatio,
} from "../../shared/stores/espresso-calculator.store";
import { openPostSaveSheet } from "../../shared/stores/post-save-sheet.store";
import { openSaveDialog } from "../../shared/stores/save-dialog.store";
import { primeTimerForSavedBrew } from "../../shared/stores/timer.store";
import { BrewStepsViewToggleStyles } from "../../shared/styles/brew-steps-view-toggle.styles";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import {
  type BrewStepsViewMode,
  type RecipeSheetViewMode,
  renderBrewStepsViewToggle,
  resolveBrewStepsForMode,
} from "../../shared/utilities/brew-steps-view.utility";
import { navigateTo } from "../../shared/utilities/navigation.utility";
import {
  isRecipeModified,
  type IRecipeModifiedCurrent,
} from "../../shared/utilities/recipe-modified.utility";
import {
  renderOriginalRecipeSheet,
  renderRecipeProvenanceBanner,
} from "../../shared/utilities/recipe-provenance.utility";
import { SHARE_OUTCOME_MESSAGES, type ShareOutcome } from "../../shared/utilities/share.utility";
import { CalculatorPageStyles } from "./calculator-page.styles";

@customElement("calculator-page")
export class CalculatorPage extends SignalWatcher(LitElement) {
  static styles = [CalculatorPageStyles, BrewStepsViewToggleStyles, responsiveScreenStyles];

  @state() private _shareStatusText = "";
  @state() private _stepsEditing = false;
  @state() private _recipePickerOpen = false;
  @state() private _originalRecipeOpen = false;
  /** Which version of `brewStepsSignal` the inline card shows - only relevant while not `_stepsEditing` and `loadedRecipeSourceSignal` is present. Defaults to today's plain behavior. */
  @state() private _stepsViewMode: BrewStepsViewMode = "modified";
  /** Which version the "see the original" sheet shows - defaults to today's plain behavior (the curated recipe card). */
  @state() private _originalRecipeViewMode: RecipeSheetViewMode = "original";

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

  /**
   * Espresso's numbers live on their own signals, so a full reset needs its
   * own reset function too - `resetCalculator()` still runs either way so
   * the espresso branch gets the same `primedFromNameSignal`/
   * `primedBrewTypeSignal` clearing and chooser-reopening (via
   * `clearBrewStepsState()`) that the pour-over branch gets, instead of
   * hand-duplicating that logic here.
   */
  private _onReset = (): void => {
    if (selectedBrewTypeSignal.value === "Espresso Shot") {
      resetEspressoCalculator();
    }
    resetCalculator();
  };

  private _onRecipeSelect = (
    event: CustomEvent<
      | IAeropressRecipe
      | IAeropressExpertRecipe
      | IV60Recipe
      | IOrigamiRecipe
      | IKalitaWaveRecipe
      | IChemexRecipe
      | ICleverDripperRecipe
      | IHarioSwitchRecipe
      | IEspressoShotStyle
      | IEspressoProfile
    >,
  ): void => {
    const selectedType = selectedBrewTypeSignal.value;
    if (selectedType === "Aeropress") {
      // Distinguish the two by the presence of `author`, which only a
      // named-creator `IAeropressExpertRecipe` carries (a WAC entry has
      // `competitor` instead).
      if ("author" in event.detail) {
        loadAeropressExpertRecipeIntoCalculator(event.detail as IAeropressExpertRecipe);
      } else {
        loadAeropressRecipeIntoCalculator(event.detail as IAeropressRecipe);
      }
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
    } else if (selectedType === "Espresso Shot") {
      // Distinguish the two by the presence of `preinfusionSec`, which only
      // a curated `IEspressoProfile` carries.
      if ("preinfusionSec" in event.detail) {
        loadEspressoProfileIntoCalculator(event.detail as IEspressoProfile);
      } else {
        loadEspressoShotStyleIntoCalculator(event.detail as IEspressoShotStyle);
      }
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
            ><brew-icon .svg="${CALCULATE_ICON_SVG}" size="18"></brew-icon> Quick
            calculator</brew-button
          >

          <div class="chooser-divider"><span>or pick a method</span></div>

          <brew-type-picker
            .types="${allBrewTypesSignal.value}"
            selected=""
            @type-select="${(e: CustomEvent<string>) => selectBrewType(e.detail)}"
            @type-add="${this._onChooserTypeAdd}"
          ></brew-type-picker>
        </div>
        <brew-bottom-nav active="calculate"></brew-bottom-nav>
      </div>
    `;
  }

  render(): HTMLTemplateResult {
    const selectedType = selectedBrewTypeSignal.value;
    const regexVowels = /^[aeiou]/i;
    if (selectedType === null) return this._renderChooser();

    const isEspresso = selectedType === "Espresso Shot";
    const coffee = coffeeSignal.value;
    const water = waterSignal.value;
    const oz = ozSignal.value;
    const isValid = isEspresso
      ? Boolean(espressoDoseInSignal.value && espressoDoseOutSignal.value)
      : Boolean(water && oz && coffee);
    const recentBrews = recentSavedBrewsSignal.value;
    const isQuickCalculator = selectedType === QUICK_CALCULATOR;
    const brewSteps = isQuickCalculator ? null : brewStepsSignal.value;
    const curatedRecipes = [
      "Aeropress",
      "V60",
      "Origami",
      "Kalita Wave",
      "Chemex",
      "Clever Dripper",
      "Clever",
      "Hario Switch",
      "Switch",
      "Espresso Shot",
    ];

    const hasCuratedRecipes = curatedRecipes.includes(selectedType);
    const recipeSource = isQuickCalculator ? null : loadedRecipeSourceSignal.value;
    const recipeCurrent: IRecipeModifiedCurrent = isEspresso
      ? {
          ratio: espressoRatioSignal.value.toString(),
          water: espressoDoseOutSignal.value.toString(),
          coffee: espressoDoseInSignal.value,
          steps: brewStepsSignal.value?.steps ?? [],
        }
      : {
          ratio: ratioSignal.value,
          water: waterSignal.value,
          coffee: coffeeSignal.value,
          steps: brewStepsSignal.value?.steps ?? [],
        };
    /** The toggle+diff-aware card only applies to the static display of an actually-modified recipe - while `_stepsEditing`, or when nothing's actually changed (nothing to diff), behavior is unchanged (plain card, no toggle). */
    const isRecipeActuallyModified = recipeSource
      ? isRecipeModified(recipeCurrent, recipeSource)
      : false;
    const resolvedSteps =
      recipeSource && !this._stepsEditing && isRecipeActuallyModified
        ? resolveBrewStepsForMode(brewSteps, recipeSource, this._stepsViewMode)
        : null;

    return html`
      <div class="screen">
        <brew-top-bar title="Calculator"></brew-top-bar>

        <div class="content">
          ${
            primedFromNameSignal.value
              ? html`
                  <div class="primed-banner">
                    <brew-icon .svg="${REPLAY_ICON}" size="18"></brew-icon>
                    <span class="primed-banner-text"
                      >Loaded from ${primedFromNameSignal.value}</span
                    >
                    <brew-icon-button
                      .svgIcon="${CLOSE_ICON}"
                      size="18"
                      aria-label="Dismiss"
                      @icon-click="${dismissPrimedBanner}"
                    ></brew-icon-button>
                  </div>
                `
              : nothing
          }
          ${
            isQuickCalculator
              ? nothing
              : html`
                  <div class="type-chip-row">
                    <span class="type-chip">${selectedType}</span>
                    <brew-button variant="text" @button-click="${this._onChangeType}"
                      >Change</brew-button
                    >
                  </div>
                `
          }
          ${
            isQuickCalculator
              ? nothing
              : renderRecipeProvenanceBanner(loadedRecipeSourceSignal.value, recipeCurrent, () => {
                  this._originalRecipeOpen = true;
                })
          }
          ${
            isEspresso
              ? html`
                  <brew-espresso-calculator
                    dose-in="${espressoDoseInSignal.value}"
                    ratio="${espressoRatioSignal.value}"
                    dose-out="${espressoDoseOutSignal.value}"
                    @dose-in-change="${(e: CustomEvent<string>) => setEspressoDoseIn(e.detail)}"
                    @ratio-change="${(e: CustomEvent<string>) => setEspressoRatio(e.detail)}"
                    @dose-out-change="${(e: CustomEvent<string>) => setEspressoDoseOut(e.detail)}"
                  ></brew-espresso-calculator>
                `
              : html`
                  <brew-ratio-form
                    ratio="${ratioSignal.value}"
                    water="${water}"
                    oz="${oz}"
                    .coffee="${coffee}"
                    @ratio-change="${(e: CustomEvent<string>) => setRatio(e.detail)}"
                    @water-change="${(e: CustomEvent<string>) => setWater(e.detail)}"
                    @oz-change="${(e: CustomEvent<string>) => setOz(e.detail)}"
                  ></brew-ratio-form>
                `
          }
          ${
            brewSteps
              ? html`
                  ${
                    resolvedSteps
                      ? renderBrewStepsViewToggle(this._stepsViewMode, (mode) => {
                          this._stepsViewMode = mode;
                        })
                      : nothing
                  }
                  <brew-steps-card
                    .config="${resolvedSteps ? resolvedSteps.config : brewSteps}"
                    .diffAgainst="${resolvedSteps ? resolvedSteps.diffAgainst : null}"
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
              : nothing
          }

          <div class="row actions">
            <brew-button variant="outlined" full-width @button-click="${this._onReset}"
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
            ><brew-icon .svg="${TIMER_ICON_SVG}" size="22"></brew-icon> Start guided
            timer</brew-button
          >
          <brew-button
            variant="filled"
            full-width
            large
            ?disabled="${!isValid}"
            @button-click="${openSaveDialog}"
            ><brew-icon .svg="${SAVED_ICON_SVG}" size="18"></brew-icon> Save</brew-button
          >
          ${
            this._shareStatusText
              ? html`<p class="share-status">${this._shareStatusText}</p>`
              : null
          }
          ${
            hasCuratedRecipes
              ? html`
                  <brew-button
                    variant="outlined"
                    full-width
                    @button-click="${() => {
                      this._recipePickerOpen = true;
                    }}"
                    ><brew-icon .svg="${MENU_BOOK_ICON_SVG}" size="18"></brew-icon> ${
                      selectedType === "Aeropress"
                        ? "Load an AeroPress recipe"
                        : selectedType === "Espresso Shot"
                          ? "Load an espresso recipe"
                          : `Load ${regexVowels.test(selectedType.toLowerCase()) ? "an" : "a"} ${selectedType} barista recipe`
                    }</brew-button
                  >
                `
              : nothing
          }
          ${
            isEspresso
              ? nothing
              : html`
                  <div class="ratio-tips">
                    <div class="ratio-tips-header">
                      <brew-icon .svg="${INFO_ICON_SVG}" size="20"></brew-icon>
                      <span class="ratio-tips-title">Ratio tips</span>
                    </div>
                    <p class="ratio-tips-body">Lower ratio = stronger, more intense brew.</p>
                    <p class="ratio-tips-body">Higher ratio = weaker, lighter cup.</p>
                    <p class="ratio-tips-body">
                      As always - Adjust to taste. If it tastes good, the math and numbers are just
                      numbers.
                    </p>
                    <span class="ratio-tips-body">Brew Examples</span>
                    <ul class="ratio-tips-body">
                      <li>Pour-over/drip: 1:15–18</li>
                      <li>Espresso: 1:2</li>
                      <li>Cold brew: 1:3–5</li>
                    </ul>
                  </div>
                `
          }
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
        ${
          isQuickCalculator
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
                ${renderOriginalRecipeSheet(
                  loadedRecipeSourceSignal.value,
                  this._originalRecipeOpen,
                  () => {
                    this._originalRecipeOpen = false;
                  },
                  recipeCurrent,
                  this._originalRecipeViewMode,
                  (mode) => {
                    this._originalRecipeViewMode = mode;
                  },
                )}
              `
        }
      </div>
    `;
  }
}
