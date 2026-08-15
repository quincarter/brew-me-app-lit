import type { IBrewStep, IEspressoProfile, IEspressoShotStyle } from "../interfaces/brew.interface";

/**
 * Standard shot styles carry no per-style preinfusion/grind/temp of their
 * own (unlike `IEspressoProfile`) - these fixed defaults fill in
 * `buildEspressoSteps` for a plain `IEspressoShotStyle`.
 */
export const ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC = 5;
export const ESPRESSO_STYLE_DEFAULT_GRIND = "Fine";
export const ESPRESSO_STYLE_DEFAULT_WATER_TEMP = "200°F";

/**
 * Builds the Brew Steps card's row sequence for an espresso pull - grind/
 * temp notes plus timed preinfusion and shot phases. Shared by
 * `brew-steps.store.ts`'s "Load a recipe" flow, `brew.store.ts`'s "Brew
 * this recipe now", `brew-steps-presets.data.ts`'s default "Espresso Shot"
 * preset, and `getEspressoRecipeSteps` below (used by the recipe registry's
 * "Original recipe" comparison) - one canonical row shape for every espresso
 * consumer instead of several hand-copied literals.
 */
export const buildEspressoSteps = (
  preinfusionSec: number,
  shotTimeSec: number,
  grind: string,
  waterTemp: string,
): IBrewStep[] => [
  { id: "espresso-grind", label: "Grind", kind: "note", value: grind },
  { id: "espresso-temp", label: "Water temp", kind: "note", value: waterTemp },
  { id: "espresso-preinfusion", label: "Preinfusion", kind: "timed", seconds: preinfusionSec },
  { id: "espresso-shot", label: "Shot time", kind: "timed", seconds: shotTimeSec },
];

/**
 * "{label}" for a plain shot style, "{name}" for a named technique profile -
 * the display label used wherever an espresso recipe is referenced (the
 * Calculator's "Pulled from"/"Modified from" banner, "Brew this recipe
 * now"'s saved-brew provenance, the recipe registry's card rendering).
 * Discriminates the same way the rest of the codebase does: only
 * `IEspressoProfile` carries `preinfusionSec`.
 */
export const getEspressoRecipeLabel = (recipe: IEspressoShotStyle | IEspressoProfile): string =>
  "preinfusionSec" in recipe ? recipe.name : recipe.label;

/**
 * The recipe's Brew Steps row sequence - a profile's own preinfusion/grind/
 * water temp, or the style-wide defaults for a plain shot style that has no
 * technique of its own.
 */
export const getEspressoRecipeSteps = (
  recipe: IEspressoShotStyle | IEspressoProfile,
): IBrewStep[] =>
  "preinfusionSec" in recipe
    ? buildEspressoSteps(recipe.preinfusionSec, recipe.shotTimeSec, recipe.grind, recipe.waterTemp)
    : buildEspressoSteps(
        ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
        recipe.shotTimeSec,
        ESPRESSO_STYLE_DEFAULT_GRIND,
        ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
      );
