import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import { CHEMEX_RECIPES, CHEMEX_RECIPES_SOURCE } from "../../shared/data/chemex-recipes.data";
import type { IChemexRecipe } from "../../shared/interfaces/brew.interface";
import { brewChemexRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { ChemexRecipesPageStyles } from "./chemex-recipes-page.styles";

@customElement("chemex-recipes-page")
export class ChemexRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [ChemexRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Chemex Recipes",
    guideId: "chemex",
    intro:
      "Curated Chemex recipes — from world-renowned coffee expert James Hoffmann and Chemex Classic to specialty roasteries including Sweet Bloom, Brandywine, Pergamino, and The Barn.",
    source: {
      name: CHEMEX_RECIPES_SOURCE.name,
      url: CHEMEX_RECIPES_SOURCE.url,
      description: "Explore more dripper & barista guides on Cup Timer",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${CHEMEX_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${CHEMEX_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IChemexRecipe>) => brewChemexRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
