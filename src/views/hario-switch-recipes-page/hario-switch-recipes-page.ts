import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import {
  HARIO_SWITCH_RECIPES,
  HARIO_SWITCH_RECIPES_SOURCE,
} from "../../shared/data/hario-switch-recipes.data";
import type { IHarioSwitchRecipe } from "../../shared/interfaces/brew.interface";
import { brewHarioSwitchRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { HarioSwitchRecipesPageStyles } from "./hario-switch-recipes-page.styles";

@customElement("hario-switch-recipes-page")
export class HarioSwitchRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [HarioSwitchRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "Hario Switch Recipes",
    guideId: "hario-switch",
    intro:
      "Curated Hario Switch recipes — from WBrC Champions Tetsu Kasuya, Weihong Zhang, Kunie Inaba, and Charity Cheung to Kyoto roaster Kurasu.",
    callout: {
      title: "Recipe Interchangeability Note",
      text: "Hario Switch and Clever Dripper recipes are both steep-and-release immersion brewing methods, so recipes designed for either brewer can generally be used interchangeably on both drippers!",
      icon: "info",
    },
    source: {
      name: HARIO_SWITCH_RECIPES_SOURCE.name,
      url: HARIO_SWITCH_RECIPES_SOURCE.url,
      description: "Explore more dripper & barista guides on Cup Timer",
    },
  };

  protected renderRecipes(): HTMLTemplateResult {
    return html`
      ${HARIO_SWITCH_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${HARIO_SWITCH_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IHarioSwitchRecipe>) => brewHarioSwitchRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }
}
