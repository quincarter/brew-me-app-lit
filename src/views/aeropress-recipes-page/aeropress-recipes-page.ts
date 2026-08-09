import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/chip/brew-chip";
import "../../components/link-card/brew-link-card";
import "../../components/recipe-card/brew-recipe-card";
import "../../components/top-bar/brew-top-bar";
import { AEROPRESS_RECIPES, WAC_RECIPES_SOURCE } from "../../shared/data/aeropress-recipes.data";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { AeropressRecipesPageStyles } from "./aeropress-recipes-page.styles";

const ALL_YEARS = "all";

/** Descending list of the years present in the recipe archive. */
const YEARS: number[] = [...new Set(AEROPRESS_RECIPES.map((recipe) => recipe.year))].sort(
  (a, b) => b - a,
);

@customElement("aeropress-recipes-page")
export class AeropressRecipesPage extends LitElement {
  static styles = [AeropressRecipesPageStyles, responsiveScreenStyles];

  @state() private _year: number | typeof ALL_YEARS = ALL_YEARS;

  private get _visibleRecipes() {
    const recipes =
      this._year === ALL_YEARS
        ? AEROPRESS_RECIPES
        : AEROPRESS_RECIPES.filter((recipe) => recipe.year === this._year);

    // Newest first, and within a year show the podium in placing order.
    return [...recipes].sort((a, b) => b.year - a.year || a.place - b.place);
  }

  render(): HTMLTemplateResult {
    const recipes = this._visibleRecipes;

    return html`
      <div class="screen">
        <brew-top-bar
          title="WAC Recipes"
          icon="arrow_back"
          href="/more/guide/aeropress"
        ></brew-top-bar>

        <div class="content">
          <p class="intro">
            Winning recipes from the World AeroPress Championship. These are competition entries
            dialled in for one specific coffee and roast — treat them as starting points, not
            gospel.
          </p>

          <brew-link-card
            href="${WAC_RECIPES_SOURCE.url}"
            icon="link"
            label="Recipes courtesy of the ${WAC_RECIPES_SOURCE.name}"
            description="View the full archive, back to 2008"
            external
          ></brew-link-card>

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

          <div class="recipes">
            ${recipes.map(
              (recipe) => html`
                <brew-recipe-card
                  .recipe="${recipe}"
                  ?start-open="${recipes.length === 1}"
                ></brew-recipe-card>
              `,
            )}
          </div>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
