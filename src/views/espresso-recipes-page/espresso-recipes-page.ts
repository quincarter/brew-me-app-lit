import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/espresso-recipe-card/brew-espresso-recipe-card";
import { ESPRESSO_PROFILES } from "../../shared/data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../shared/data/espresso-shot-styles.data";
import type { IEspressoProfile, IEspressoShotStyle } from "../../shared/interfaces/brew.interface";
import { brewEspressoRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { EspressoRecipesPageStyles } from "./espresso-recipes-page.styles";

@customElement("espresso-recipes-page")
export class EspressoRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [EspressoRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Espresso Recipes",
    guideId: "espresso",
    intro:
      "Standard shot styles for dialing in a basic pull, plus a few named profiles for specific techniques (blooming, turbo, declining pressure, and more).",
    source: {
      name: "Roastopedia",
      url: "https://roastopedia.com/espresso/",
      description: "Background on espresso extraction and dialing in",
    },
  };

  private _renderStyleCard(style: IEspressoShotStyle): HTMLTemplateResult {
    return html`
      <brew-espresso-recipe-card
        .recipe="${style}"
        ?start-open="${ESPRESSO_SHOT_STYLES.length === 1}"
        @brew-now="${(e: CustomEvent<IEspressoShotStyle>) => brewEspressoRecipeNow(e.detail)}"
      ></brew-espresso-recipe-card>
    `;
  }

  private _renderProfileCard(profile: IEspressoProfile): HTMLTemplateResult {
    return html`
      <brew-espresso-recipe-card
        .recipe="${profile}"
        ?start-open="${ESPRESSO_PROFILES.length === 1}"
        @brew-now="${(e: CustomEvent<IEspressoProfile>) => brewEspressoRecipeNow(e.detail)}"
      ></brew-espresso-recipe-card>
    `;
  }

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      <div class="section-header">Standard recipes</div>
      <div class="recipe-list">
        ${ESPRESSO_SHOT_STYLES.map((style) => this._renderStyleCard(style))}
      </div>

      <div class="section-header">Shot profiles</div>
      <div class="recipe-list">
        ${ESPRESSO_PROFILES.map((profile) => this._renderProfileCard(profile))}
      </div>
    `;
  }
}
