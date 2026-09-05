import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/chip/brew-chip";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import "../../components/recipe-card/brew-recipe-card";
import { AEROPRESS_OTHER_RECIPES } from "../../shared/data/aeropress-other-recipes.data";
import { AEROPRESS_RECIPES, WAC_RECIPES_SOURCE } from "../../shared/data/aeropress-recipes.data";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
} from "../../shared/interfaces/brew.interface";
import {
  brewAeropressExpertRecipeNow,
  brewAeropressRecipeNow,
} from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { AeropressRecipesPageStyles } from "./aeropress-recipes-page.styles";

const ALL_YEARS = "all";
const OTHER = "other";
type YearFilter = number | typeof ALL_YEARS | typeof OTHER;

/** Descending list of the years present in the recipe archive. */
const YEARS: number[] = [...new Set(AEROPRESS_RECIPES.map((recipe) => recipe.year))].sort(
  (a, b) => b - a,
);

@customElement("aeropress-recipes-page")
export class AeropressRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [AeropressRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "AeroPress Recipes",
    guideId: "aeropress",
    intro:
      "Winning recipes from the World AeroPress Championship, plus other named creators' recipes that aren't championship entries. These are dialled in for one specific coffee and roast — treat them as starting points, not gospel.",
    source: {
      name: WAC_RECIPES_SOURCE.name,
      url: WAC_RECIPES_SOURCE.url,
      description: "View the full archive, back to 2008",
    },
  };

  @state() private _filter: YearFilter = ALL_YEARS;

  private get _visibleRecipes() {
    const recipes =
      this._filter === ALL_YEARS
        ? AEROPRESS_RECIPES
        : AEROPRESS_RECIPES.filter((recipe) => recipe.year === this._filter);

    // Newest first, and within a year show the podium in placing order.
    return [...recipes].sort((a, b) => b.year - a.year || a.place - b.place);
  }

  protected renderFilters(): HTMLTemplateResult {
    return html`
      <div class="filters">
        <brew-chip
          label="All"
          ?selected="${this._filter === ALL_YEARS}"
          @chip-click="${() => {
            this._filter = ALL_YEARS;
          }}"
        ></brew-chip>
        ${YEARS.map(
          (year) => html`
            <brew-chip
              label="${year.toString()}"
              ?selected="${this._filter === year}"
              @chip-click="${() => {
                this._filter = year;
              }}"
            ></brew-chip>
          `,
        )}
        <brew-chip
          label="Other"
          ?selected="${this._filter === OTHER}"
          @chip-click="${() => {
            this._filter = OTHER;
          }}"
        ></brew-chip>
      </div>
    `;
  }

  private _renderOtherRecipes(): HTMLTemplateResult {
    return html`
      ${AEROPRESS_OTHER_RECIPES.map((recipe, index) => {
        const colors = getAvatarColors(index);
        return html`
          <brew-pourover-recipe-card
            .recipe="${recipe}"
            ?start-open="${AEROPRESS_OTHER_RECIPES.length === 1}"
            avatar-initial="${getInitial(recipe.author)}"
            avatar-bg="${colors.background}"
            avatar-fg="${colors.foreground}"
            @brew-now="${(e: CustomEvent<IAeropressExpertRecipe>) =>
              brewAeropressExpertRecipeNow(e.detail)}"
          ></brew-pourover-recipe-card>
        `;
      })}
    `;
  }

  protected renderRecipes(): HTMLTemplateResult {
    if (this._filter === OTHER) {
      return this._renderOtherRecipes();
    }

    const recipes = this._visibleRecipes;

    return html`
      ${recipes.map(
        (recipe) => html`
          <brew-recipe-card
            .recipe="${recipe}"
            ?start-open="${recipes.length === 1}"
            @brew-now="${(e: CustomEvent<IAeropressRecipe>) => brewAeropressRecipeNow(e.detail)}"
          ></brew-recipe-card>
        `,
      )}
    `;
  }
}
