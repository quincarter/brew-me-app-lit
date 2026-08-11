import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import { KALITA_WAVE_RECIPES } from "../../shared/data/kalita-wave-recipes.data";
import type { IKalitaWaveRecipe } from "../../shared/interfaces/brew.interface";
import { brewKalitaWaveRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { KalitaWaveRecipesPageStyles } from "./kalita-wave-recipes-page.styles";

export const KALITA_WAVE_RECIPES_SOURCE = {
  name: "Cup Timer Kalita Wave Recipes",
  url: "https://www.cup-timer.com/en/dripper/kalita_wave",
};

@customElement("kalita-wave-recipes-page")
export class KalitaWaveRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [KalitaWaveRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Kalita Wave Recipes",
    guideId: "kalita-wave",
    intro:
      "15 curated Kalita Wave recipes — from World Brewers Cup champion James McCarthy and coffee icon George Howell to specialty roasteries like Coava, Coffee Collective, Onyx, Verve, and Kurasu.",
    source: {
      name: KALITA_WAVE_RECIPES_SOURCE.name,
      url: KALITA_WAVE_RECIPES_SOURCE.url,
      description: "Explore more dripper & barista guides on Cup Timer",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${KALITA_WAVE_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${KALITA_WAVE_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IKalitaWaveRecipe>) => brewKalitaWaveRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
