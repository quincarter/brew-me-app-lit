import type { HTMLTemplateResult } from "lit";
import { html, LitElement } from "lit";
import "../components/bottom-nav/brew-bottom-nav";
import "../components/icon/brew-icon";
import "../components/link-card/brew-link-card";
import "../components/top-bar/brew-top-bar";

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface IRecipePageConfig {
  title: string;
  guideId: string;
  intro: string;
  callout?: {
    title?: string;
    text: string;
    icon?: string;
  };
  source: {
    name: string;
    url: string;
    description?: string;
  };
}

/**
 * # RecipePageMixin
 * A mixin that provides the common page shell layout (top bar, intro text,
 * source link card, optional filter section, recipe list container, and bottom nav)
 * for recipe archive screens (AeroPress WAC, V60, Origami, Kalita Wave, Chemex, Clever, Switch).
 */
export function RecipePageMixin<T extends Constructor<LitElement>>(superClass: T) {
  abstract class RecipePageClass extends superClass {
    abstract pageConfig: IRecipePageConfig;

    /** Optional hook to render filter controls above the recipe list. */
    protected renderFilters(): HTMLTemplateResult | null {
      return null;
    }

    /** Abstract hook for rendering the recipe cards. */
    protected abstract renderRecipes(): HTMLTemplateResult;

    render(): HTMLTemplateResult {
      const config = this.pageConfig;

      return html`
        <div class="screen">
          <brew-top-bar
            title="${config.title}"
            icon="arrow_back"
            href="/more/guide/${config.guideId}"
          ></brew-top-bar>

          <div class="content">
            <p class="intro">${config.intro}</p>

            ${config.callout
              ? html`
                  <div class="recipe-callout">
                    <brew-icon name="${config.callout.icon ?? "info"}" size="20"></brew-icon>
                    <div class="callout-content">
                      ${config.callout.title
                        ? html`<strong class="callout-title">${config.callout.title}</strong>`
                        : null}
                      <p class="callout-text">${config.callout.text}</p>
                    </div>
                  </div>
                `
              : null}

            <brew-link-card
              href="${config.source.url}"
              icon="link"
              label="Recipes courtesy of ${config.source.name}"
              description="${config.source.description ?? "View original source"}"
              external
            ></brew-link-card>

            ${this.renderFilters() ?? null}

            <div class="recipes">
              ${this.renderRecipes()}
            </div>
          </div>

          <brew-bottom-nav active="more"></brew-bottom-nav>
        </div>
      `;
    }
  }

  return RecipePageClass;
}
