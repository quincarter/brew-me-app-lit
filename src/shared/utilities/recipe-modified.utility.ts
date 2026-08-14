import type { IBrewStep, ILoadedRecipeSource } from "../interfaces/brew.interface";

/** The subset of live calculator/saved-brew state needed to compare against a loaded recipe's snapshot. */
export interface IRecipeModifiedCurrent {
  ratio: string;
  water: string;
  coffee: number | null;
  steps: IBrewStep[];
}

/** Row-by-row step comparison, exported for `share.utility.ts` to decide whether a brew's steps diverge from its `recipeSource` snapshot enough to need sending over a `/share` link. */
export const stepsEqual = (a: IBrewStep[], b: IBrewStep[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((step, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      step.id === other.id &&
      step.label === other.label &&
      step.kind === other.kind &&
      (step.seconds ?? null) === (other.seconds ?? null) &&
      (step.value ?? "") === (other.value ?? "") &&
      (step.note ?? "") === (other.note ?? "")
    );
  });
};

/**
 * Compares the live ratio/water/coffee numbers and step sequence against a
 * `ILoadedRecipeSource` snapshot - drives the Calculator's and Saved
 * Detail's "Pulled from {label}" vs. "Modified from {label} — tap to see
 * the original" banner text.
 */
export const isRecipeModified = (
  current: IRecipeModifiedCurrent,
  source: ILoadedRecipeSource,
): boolean => {
  if (Number.parseFloat(current.ratio) !== source.ratio) return true;
  if (Number.parseFloat(current.water) !== source.water) return true;
  if (current.coffee !== source.coffee) return true;
  return !stepsEqual(current.steps, source.steps);
};
