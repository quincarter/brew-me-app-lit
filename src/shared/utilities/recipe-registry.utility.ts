import { type HTMLTemplateResult, html } from "lit";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import "../../components/recipe-card/brew-recipe-card";
import { AEROPRESS_RECIPES } from "../data/aeropress-recipes.data";
import { CHEMEX_RECIPES } from "../data/chemex-recipes.data";
import { CLEVER_DRIPPER_RECIPES } from "../data/clever-dripper-recipes.data";
import { HARIO_SWITCH_RECIPES } from "../data/hario-switch-recipes.data";
import { KALITA_WAVE_RECIPES } from "../data/kalita-wave-recipes.data";
import { ORIGAMI_RECIPES } from "../data/origami-recipes.data";
import { V60_RECIPES } from "../data/v60-recipes.data";
import type { IAeropressRecipe } from "../interfaces/brew.interface";
import type { IPouroverRecipe } from "./pourover-recipe.utility";

export type IAnyRecipe = IAeropressRecipe | IPouroverRecipe;

export interface IResolvedRecipe {
  recipe: IAnyRecipe;
  kind: "aeropress" | "pourover";
}

/** Pre-indexed O(1) map for recipe lookup by ID across all categories. */
const RECIPE_REGISTRY = new Map<string, IResolvedRecipe>();

// Index AeroPress recipes
for (const recipe of AEROPRESS_RECIPES) {
  RECIPE_REGISTRY.set(recipe.id, { recipe, kind: "aeropress" });
}

// Index Pour-Over recipes (V60, Origami, Kalita Wave, Chemex, Clever, Hario Switch)
const POUROVER_COLLECTIONS: IPouroverRecipe[][] = [
  V60_RECIPES,
  ORIGAMI_RECIPES,
  KALITA_WAVE_RECIPES,
  CHEMEX_RECIPES,
  CLEVER_DRIPPER_RECIPES,
  HARIO_SWITCH_RECIPES,
];

for (const collection of POUROVER_COLLECTIONS) {
  for (const recipe of collection) {
    RECIPE_REGISTRY.set(recipe.id, { recipe, kind: "pourover" });
  }
}

/**
 * Fast O(1) lookup to find any recipe by ID across all recipe datasets.
 */
export const findRecipeById = (recipeId: string): IResolvedRecipe | null => {
  return RECIPE_REGISTRY.get(recipeId) ?? null;
};

export interface IRenderRecipeCardOptions {
  startOpen?: boolean;
  hideBrewButton?: boolean;
}

/**
 * Clean component helper to render the appropriate recipe card (<brew-recipe-card> or <brew-pourover-recipe-card>)
 * for any recipe by ID.
 */
export const renderRecipeCard = (
  recipeId: string,
  options: IRenderRecipeCardOptions = {},
): HTMLTemplateResult => {
  const resolved = findRecipeById(recipeId);
  if (!resolved) {
    return html`<p>This recipe is no longer available.</p>`;
  }

  const { startOpen = true, hideBrewButton = false } = options;

  if (resolved.kind === "aeropress") {
    return html`
      <brew-recipe-card
        .recipe="${resolved.recipe as IAeropressRecipe}"
        ?start-open="${startOpen}"
        ?hide-brew-button="${hideBrewButton}"
      ></brew-recipe-card>
    `;
  }

  return html`
    <brew-pourover-recipe-card
      .recipe="${resolved.recipe as IPouroverRecipe}"
      ?start-open="${startOpen}"
      ?hide-brew-button="${hideBrewButton}"
    ></brew-pourover-recipe-card>
  `;
};
