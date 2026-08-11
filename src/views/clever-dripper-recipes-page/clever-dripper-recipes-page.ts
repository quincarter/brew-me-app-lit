import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import { CLEVER_DRIPPER_RECIPES, CLEVER_DRIPPER_RECIPES_SOURCE } from "../../shared/data/clever-dripper-recipes.data";
import type { ICleverDripperRecipe } from "../../shared/interfaces/brew.interface";
import { brewCleverDripperRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { CleverDripperRecipesPageStyles } from "./clever-dripper-recipes-page.styles";

@customElement("clever-dripper-recipes-page")
export class CleverDripperRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [CleverDripperRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Clever Dripper Recipes",
    guideId: "clever-dripper",
    intro:
      "Curated Clever Dripper recipes — from specialty barista Morgan Eckroth and James Hoffmann to Workshop Coffee and Center Coffee.",
    callout: {
      title: "Recipe Interchangeability Note",
      text: "Clever Dripper and Hario Switch recipes are both steep-and-release immersion brewing methods, so recipes designed for either brewer can generally be used interchangeably on both drippers!",
      icon: "info",
    },
    source: {
      name: CLEVER_DRIPPER_RECIPES_SOURCE.name,
      url: CLEVER_DRIPPER_RECIPES_SOURCE.url,
      description: "Explore more dripper & barista guides on Cup Timer",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${CLEVER_DRIPPER_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${CLEVER_DRIPPER_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<ICleverDripperRecipe>) => brewCleverDripperRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
