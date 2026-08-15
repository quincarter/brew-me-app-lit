import { type HTMLTemplateResult, html } from "lit";
import "../../components/espresso-recipe-card/brew-espresso-recipe-card";
import "../../components/pourover-recipe-card/brew-pourover-recipe-card";
import "../../components/recipe-card/brew-recipe-card";
import { AEROPRESS_RECIPES } from "../data/aeropress-recipes.data";
import { CHEMEX_RECIPES } from "../data/chemex-recipes.data";
import { CLEVER_DRIPPER_RECIPES } from "../data/clever-dripper-recipes.data";
import { ESPRESSO_PROFILES } from "../data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../data/espresso-shot-styles.data";
import { HARIO_SWITCH_RECIPES } from "../data/hario-switch-recipes.data";
import { KALITA_WAVE_RECIPES } from "../data/kalita-wave-recipes.data";
import { ORIGAMI_RECIPES } from "../data/origami-recipes.data";
import { V60_RECIPES } from "../data/v60-recipes.data";
import type {
  IAeropressRecipe,
  IBrewStep,
  IEspressoProfile,
  IEspressoShotStyle,
  ILoadedRecipeSource,
} from "../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "./aeropress-recipe.utility";
import { getEspressoRecipeLabel, getEspressoRecipeSteps } from "./espresso-recipe.utility";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  type IPouroverRecipe,
  parseDoseGrams,
  parseWaterGrams,
} from "./pourover-recipe.utility";

export type IAnyRecipe = IAeropressRecipe | IPouroverRecipe | IEspressoShotStyle | IEspressoProfile;

export interface IResolvedRecipe {
  recipe: IAnyRecipe;
  kind: "aeropress" | "pourover" | "espresso";
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

// Index espresso shot styles and technique profiles
for (const recipe of ESPRESSO_SHOT_STYLES) {
  RECIPE_REGISTRY.set(recipe.id, { recipe, kind: "espresso" });
}

for (const recipe of ESPRESSO_PROFILES) {
  RECIPE_REGISTRY.set(recipe.id, { recipe, kind: "espresso" });
}

/**
 * Fast O(1) lookup to find any recipe by ID across all recipe datasets.
 */
export const findRecipeById = (recipeId: string): IResolvedRecipe | null => {
  return RECIPE_REGISTRY.get(recipeId) ?? null;
};

/**
 * Rebuilds the `ILoadedRecipeSource` snapshot for a recipe purely from its
 * ID - the same deterministic derivation `brew-steps.store.ts`'s
 * `load*RecipeIntoCalculator` functions use when a recipe is first loaded
 * (ratio/steps are always computed from the recipe's own curated fields, no
 * randomness). Lets a `/share` link carry just a `recipeId` instead of the
 * full label/ratio/water/coffee/steps snapshot - both ends of the link have
 * the same bundled recipe data, so there's nothing to actually transmit.
 */
export const buildRecipeSource = (recipeId: string): ILoadedRecipeSource | null => {
  const resolved = findRecipeById(recipeId);
  if (!resolved) return null;

  if (resolved.kind === "aeropress") {
    const recipe = resolved.recipe as IAeropressRecipe;
    return {
      recipeId: recipe.id,
      label: getAeropressRecipeLabel(recipe),
      ratio: getAeropressRecipeRatio(recipe),
      water: recipe.totalWaterGrams,
      coffee: recipe.doseGrams,
      steps: getAeropressRecipeSteps(recipe),
    };
  }

  if (resolved.kind === "espresso") {
    const recipe = resolved.recipe as IEspressoShotStyle | IEspressoProfile;
    return {
      recipeId: recipe.id,
      label: getEspressoRecipeLabel(recipe),
      ratio: recipe.ratio,
      water: recipe.doseOut,
      coffee: recipe.doseIn,
      steps: getEspressoRecipeSteps(recipe),
    };
  }

  const recipe = resolved.recipe as IPouroverRecipe;
  return {
    recipeId: recipe.id,
    label: getPouroverRecipeLabel(recipe),
    ratio: getPouroverRecipeRatio(recipe),
    water: parseWaterGrams(recipe),
    coffee: parseDoseGrams(recipe),
    steps: getPouroverRecipeSteps(recipe),
  };
};

export interface IRenderRecipeCardOptions {
  startOpen?: boolean;
  hideBrewButton?: boolean;
  /** Passed straight through to the rendered card's own `.diffAgainst` - see `RecipeCard`/`PourOverRecipeCard`'s doc comments for the merged diff treatment this drives. */
  diffAgainst?: IBrewStep[] | null;
}

/**
 * Clean component helper to render the appropriate recipe card
 * (<brew-recipe-card>, <brew-pourover-recipe-card>, or
 * <brew-espresso-recipe-card>) for any recipe by ID.
 */
export const renderRecipeCard = (
  recipeId: string,
  options: IRenderRecipeCardOptions = {},
): HTMLTemplateResult => {
  const resolved = findRecipeById(recipeId);
  if (!resolved) {
    return html`<p>This recipe is no longer available.</p>`;
  }

  const { startOpen = true, hideBrewButton = false, diffAgainst = null } = options;

  if (resolved.kind === "aeropress") {
    return html`
      <brew-recipe-card
        .recipe="${resolved.recipe as IAeropressRecipe}"
        ?start-open="${startOpen}"
        ?hide-brew-button="${hideBrewButton}"
        .diffAgainst="${diffAgainst}"
      ></brew-recipe-card>
    `;
  }

  if (resolved.kind === "espresso") {
    return html`
      <brew-espresso-recipe-card
        .recipe="${resolved.recipe as IEspressoShotStyle | IEspressoProfile}"
        ?start-open="${startOpen}"
        ?hide-brew-button="${hideBrewButton}"
        .diffAgainst="${diffAgainst}"
      ></brew-espresso-recipe-card>
    `;
  }

  return html`
    <brew-pourover-recipe-card
      .recipe="${resolved.recipe as IPouroverRecipe}"
      ?start-open="${startOpen}"
      ?hide-brew-button="${hideBrewButton}"
      .diffAgainst="${diffAgainst}"
    ></brew-pourover-recipe-card>
  `;
};
