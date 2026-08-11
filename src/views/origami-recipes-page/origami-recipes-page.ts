import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import { ORIGAMI_RECIPES, ORIGAMI_RECIPES_SOURCE } from "../../shared/data/origami-recipes.data";
import type { IOrigamiRecipe } from "../../shared/interfaces/brew.interface";
import { brewOrigamiRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { OrigamiRecipesPageStyles } from "./origami-recipes-page.styles";

@customElement("origami-recipes-page")
export class OrigamiRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [OrigamiRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Origami Recipes",
    guideId: "origami",
    intro:
      "Six well-known Origami dripper recipes — from World Brewers Cup champions Jia Ning Du and Carlos Medina to specialty roasteries like Onyx, Kurasu, and Maruyama.",
    source: {
      name: ORIGAMI_RECIPES_SOURCE.name,
      url: ORIGAMI_RECIPES_SOURCE.url,
      description: "Explore more dripper & barista guides on Cup Timer",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${ORIGAMI_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${ORIGAMI_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IOrigamiRecipe>) => brewOrigamiRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
