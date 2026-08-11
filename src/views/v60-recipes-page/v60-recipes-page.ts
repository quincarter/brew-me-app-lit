import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import { V60_RECIPES, V60_RECIPES_SOURCE } from "../../shared/data/v60-recipes.data";
import type { IV60Recipe } from "../../shared/interfaces/brew.interface";
import { brewV60RecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { V60RecipesPageStyles } from "./v60-recipes-page.styles";

@customElement("v60-recipes-page")
export class V60RecipesPage extends RecipePageMixin(LitElement) {
  static styles = [V60RecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "V60 Recipes",
    guideId: "v60",
    intro:
      "Five well-known V60 recipes side by side - three from named coffee experts, plus two brand recipes from the same roundup. Each is dialed in for one brewer's own setup, so treat them as starting points, not gospel.",
    source: {
      name: V60_RECIPES_SOURCE.name,
      url: V60_RECIPES_SOURCE.url,
      description: "Read the full breakdown and comments",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${V60_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${V60_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IV60Recipe>) => brewV60RecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
