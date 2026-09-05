import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { AEROPRESS_OTHER_RECIPES } from "../../shared/data/aeropress-other-recipes.data";
import { AEROPRESS_RECIPES } from "../../shared/data/aeropress-recipes.data";
import { CHEMEX_RECIPES } from "../../shared/data/chemex-recipes.data";
import { CLEVER_DRIPPER_RECIPES } from "../../shared/data/clever-dripper-recipes.data";
import { ESPRESSO_PROFILES } from "../../shared/data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../shared/data/espresso-shot-styles.data";
import { HARIO_SWITCH_RECIPES } from "../../shared/data/hario-switch-recipes.data";
import { KALITA_WAVE_RECIPES } from "../../shared/data/kalita-wave-recipes.data";
import { ORIGAMI_RECIPES } from "../../shared/data/origami-recipes.data";
import { V60_RECIPES } from "../../shared/data/v60-recipes.data";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
  IChemexRecipe,
  ICleverDripperRecipe,
  IEspressoProfile,
  IEspressoShotStyle,
  IHarioSwitchRecipe,
  IKalitaWaveRecipe,
  IOrigamiRecipe,
  IV60Recipe,
} from "../../shared/interfaces/brew.interface";
import "../bottom-sheet/brew-bottom-sheet";
import "../list-row/brew-list-row";
import { RecipePickerSheetStyles } from "./recipe-picker-sheet.styles";

const PLACE_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

export type AnyRecipe =
  | IAeropressRecipe
  | IAeropressExpertRecipe
  | IV60Recipe
  | IOrigamiRecipe
  | IKalitaWaveRecipe
  | IChemexRecipe
  | ICleverDripperRecipe
  | IHarioSwitchRecipe
  | IEspressoShotStyle
  | IEspressoProfile;

interface IRecipePickerItem {
  recipe: AnyRecipe;
  headline: string;
  supporting: string;
  initial: string;
  /** Set on the first item of a new section - renders a divider/label above it (e.g. splitting WAC podium recipes from other creators'). */
  sectionLabel?: string;
}

/**
 * # Recipe Picker Sheet
 * Generic recipe selection sheet: a `<brew-bottom-sheet>` listing curated
 * recipes for the specified `brewType` ("Aeropress", "V60", "Origami", "Kalita Wave", "Chemex", "Clever Dripper", "Espresso Shot") as tappable rows.
 * Picking one fires `recipe-select` with the full recipe object.
 * @element brew-recipe-picker-sheet
 * @fires recipe-select - `CustomEvent<AnyRecipe>` fired with the tapped recipe. Consumers are responsible for closing the sheet.
 */
export class RecipePickerSheet extends LitElement {
  static styles = [RecipePickerSheetStyles];

  @property({ type: Boolean }) open = false;

  @property({ type: String, attribute: "brew-type" }) brewType = "Aeropress";

  private _select(event: Event, recipe: AnyRecipe): void {
    // Suppresses `brew-list-row`'s default navigation (it renders as an <a>)
    // before the router's own document-level click listener sees it.
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent<AnyRecipe>("recipe-select", {
        detail: recipe,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _getRecipesAndTitle(): {
    title: string;
    hint: string;
    items: IRecipePickerItem[];
  } {
    if (this.brewType === "V60") {
      return {
        title: "Load a V60 recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: V60_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Origami") {
      return {
        title: "Load an Origami recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: ORIGAMI_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Kalita Wave") {
      return {
        title: "Load a Kalita Wave recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: KALITA_WAVE_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Chemex") {
      return {
        title: "Load a Chemex recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: CHEMEX_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Clever Dripper" || this.brewType === "Clever") {
      return {
        title: "Load a Clever Dripper recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: CLEVER_DRIPPER_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Hario Switch" || this.brewType === "Switch") {
      return {
        title: "Load a Hario Switch recipe",
        hint: "Auto-fills the ratio, water, coffee, and steps from the selected recipe.",
        items: HARIO_SWITCH_RECIPES.map((recipe) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
        })),
      };
    }

    if (this.brewType === "Espresso Shot") {
      return {
        title: "Load an espresso recipe",
        hint: "Auto-fills dose, ratio, and the shot recipe from the selected style or profile.",
        items: [
          ...ESPRESSO_SHOT_STYLES.map((style) => ({
            recipe: style,
            headline: style.label,
            supporting: `1:${style.ratio} · ${style.doseIn}g in · ${style.shotTimeSec}s`,
            initial: style.label.charAt(0),
          })),
          ...ESPRESSO_PROFILES.map((profile) => ({
            recipe: profile,
            headline: profile.name,
            supporting: profile.tagline,
            initial: profile.name.charAt(0),
          })),
        ],
      };
    }

    // Default: Aeropress (WAC podium recipes, then other creators')
    return {
      title: "Load an AeroPress recipe",
      hint: "Auto-fills the ratio, water, and coffee from the selected recipe.",
      items: [
        ...AEROPRESS_RECIPES.map((recipe, index) => {
          const placeLabel = PLACE_LABEL[recipe.place] ?? `${recipe.place}th`;
          return {
            recipe,
            headline: `${recipe.competitor} · ${recipe.year}`,
            supporting: `${placeLabel} place · ${recipe.doseGrams}g coffee : ${recipe.totalWaterGrams}g water`,
            initial: recipe.competitor.charAt(0),
            sectionLabel: index === 0 ? "World AeroPress Championship" : undefined,
          };
        }),
        ...AEROPRESS_OTHER_RECIPES.map((recipe, index) => ({
          recipe,
          headline: `${recipe.author} · ${recipe.title}`,
          supporting: `${recipe.setup.Dose ?? ""} coffee : ${recipe.setup.Water ?? ""} water`,
          initial: recipe.author.charAt(0),
          sectionLabel: index === 0 ? "Other creators" : undefined,
        })),
      ],
    };
  }

  render(): HTMLTemplateResult {
    const { title, hint, items } = this._getRecipesAndTitle();

    return html`
      <brew-bottom-sheet ?open="${this.open}" label="${title}">
        <div class="title">${title}</div>
        <p class="hint">${hint}</p>
        <div class="list">
          ${items.map(
            (item) => html`
              ${
                item.sectionLabel
                  ? html`<div class="section-label">${item.sectionLabel}</div>`
                  : nothing
              }
              <brew-list-row
                headline="${item.headline}"
                supporting="${item.supporting}"
                leading-initial="${item.initial}"
                @click="${(e: Event) => this._select(e, item.recipe)}"
              ></brew-list-row>
            `,
          )}
        </div>
      </brew-bottom-sheet>
    `;
  }
}
