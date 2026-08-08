import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/link-card/brew-link-card";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import "../../components/top-bar/brew-top-bar";
import { V60_RECIPES, V60_RECIPES_SOURCE } from "../../shared/data/v60-recipes.data";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { V60RecipesPageStyles } from "./v60-recipes-page.styles";

@customElement("v60-recipes-page")
export class V60RecipesPage extends LitElement {
  static styles = [V60RecipesPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar title="V60 Recipes" icon="arrow_back" href="/more/guide/v60"></brew-top-bar>

        <div class="content">
          <p class="intro">
            Five well-known V60 recipes side by side - three from named coffee experts, plus two
            brand recipes from the same roundup. Each is dialed in for one brewer's own setup, so
            treat them as starting points, not gospel.
          </p>

          <brew-link-card
            href="${V60_RECIPES_SOURCE.url}"
            icon="link"
            label="Recipes courtesy of ${V60_RECIPES_SOURCE.name}"
            description="Read the full breakdown and comments"
            external
          ></brew-link-card>

          <div class="recipes">
            ${V60_RECIPES.map((recipe, index) => {
              const colors = getAvatarColors(index);
              return html`
                <brew-pourover-recipe-card
                  .recipe="${recipe}"
                  ?start-open="${V60_RECIPES.length === 1}"
                  avatar-initial="${getInitial(recipe.author)}"
                  avatar-bg="${colors.background}"
                  avatar-fg="${colors.foreground}"
                ></brew-pourover-recipe-card>
              `;
            })}
          </div>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
