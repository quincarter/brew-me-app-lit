import type { IAeropressRecipe, IBrewStep } from "../interfaces/brew.interface";
import { round2 } from "./ratio.utility";

const PLACE_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/** "{competitor} · {year}, {Nth} place" - the display label used for a WAC recipe wherever it's referenced (the Calculator's "Pulled from"/"Modified from" banner, "Brew this recipe now"'s saved-brew provenance). */
export const getAeropressRecipeLabel = (recipe: IAeropressRecipe): string =>
  `${recipe.competitor} · ${recipe.year}, ${PLACE_LABEL[recipe.place] ?? `${recipe.place}th`} place`;

/** The recipe's water:coffee ratio, derived from its hand-curated doseGrams/totalWaterGrams. */
export const getAeropressRecipeRatio = (recipe: IAeropressRecipe): number =>
  round2(recipe.totalWaterGrams / recipe.doseGrams);

/**
 * Combines a recipe's setup key/values with its brew sequence into one
 * ordered step list - the recipe's hand-curated `timedSteps` (real
 * Bloom/Pour/Press phases) when available, or a flat prose-note dump as a
 * fallback for a recipe that hasn't been curated yet. Shared by the
 * Calculator's "Load a WAC recipe" flow and "Brew this recipe now" so both
 * capture the same reference detail and drive the Timer's Brew Steps card
 * identically.
 */
export const getAeropressRecipeSteps = (recipe: IAeropressRecipe): IBrewStep[] => {
  const setupSteps: IBrewStep[] = Object.entries(recipe.setup).map(([key, value]) => ({
    id: `${recipe.id}-setup-${key}`,
    label: key,
    kind: "note",
    value,
  }));
  const brewSteps: IBrewStep[] =
    recipe.timedSteps ??
    recipe.steps.map((step, index) => ({
      id: `${recipe.id}-step-${index}`,
      label: `Step ${index + 1}`,
      kind: "note",
      value: step,
      seconds: null,
    }));
  return [...setupSteps, ...brewSteps];
};
