import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/chip/brew-chip";
import "../../components/recipe-card/brew-recipe-card";
import { AEROPRESS_RECIPES, WAC_RECIPES_SOURCE } from "../../shared/data/aeropress-recipes.data";
import type { IAeropressRecipe } from "../../shared/interfaces/brew.interface";
import { brewAeropressRecipeNow } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { type IRecipePageConfig, RecipePageMixin } from "../recipe-page.mixin";
import { AeropressRecipesPageStyles } from "./aeropress-recipes-page.styles";

const ALL_YEARS = "all";

/** Descending list of the years present in the recipe archive. */
const YEARS: number[] = [...new Set(AEROPRESS_RECIPES.map((recipe) => recipe.year))].sort(
  (a, b) => b - a,
);

@customElement("aeropress-recipes-page")
export class AeropressRecipesPage extends RecipePageMixin(LitElement) {
  static styles = [AeropressRecipesPageStyles, responsiveScreenStyles];

  pageConfig: IRecipePageConfig = {
    title: "WAC Recipes",
    guideId: "aeropress",
    intro:
      "Winning recipes from the World AeroPress Championship. These are competition entries dialled in for one specific coffee and roast — treat them as starting points, not gospel.",
    source: {
      name: WAC_RECIPES_SOURCE.name,
      url: WAC_RECIPES_SOURCE.url,
      description: "View the full archive, back to 2008",
    },
  };

  @state() private _year: number | typeof ALL_YEARS = ALL_YEARS;

  private get _visibleRecipes() {
    const recipes =
      this._year === ALL_YEARS
        ? AEROPRESS_RECIPES
        : AEROPRESS_RECIPES.filter((recipe) => recipe.year === this._year);

    // Newest first, and within a year show the podium in placing order.
    return [...recipes].sort((a, b) => b.year - a.year || a.place - b.place);
  }

  protected renderFilters(): HTMLTemplateResult {
    return html`
      <div class="filters">
        <brew-chip
          label="All"
          ?selected="${this._year === ALL_YEARS}"
          @chip-click="${() => {
            this._year = ALL_YEARS;
          }}"
        ></brew-chip>
        ${YEARS.map(
          (year) => html`
            <brew-chip
              label="${year}"
              ?selected="${this._year === year}"
              @chip-click="${() => {
                this._year = year;
              }}"
            ></brew-chip>
          `,
        )}
      </div>
    `;
  }

  protected renderRecipes(): HTMLTemplateResult {
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
