import type { IBrewStep } from "./brew.interface";

/** A recipe the Timer screen was primed with via the Calculator's "Start guided timer" action. */
export interface IPrimedRecipe {
  name: string;
  /** The matching `BREW_GUIDE` entry's name (e.g. "V60") when this recipe was primed from a defined brew guide - drives the Timer screen's title. Null for a custom/unmatched brew type. */
  brewType: string | null;
  coffee: number;
  water: number;
  /** Coffee:water ratio, e.g. `16` for a 1:16 brew - shown alongside the name in the Timer's recipe caption. */
  ratio: number;
  /** Total target brew time in seconds, or null for a plain count-up stopwatch (e.g. Cold Brew, or an unmatched/custom brew type). */
  targetSeconds: number | null;
  /** The brew's step sequence (from its saved `brewSteps`, or its type's canned `BREW_STEPS_PRESETS` entry) - null when there's no step data to show. */
  steps: IBrewStep[] | null;
}

export type BrewStepStatus = "done" | "active" | "upcoming";

/** One step's live status against the timer's elapsed seconds, computed by `getBrewStepProgress`. */
export interface IBrewStepProgress {
  step: IBrewStep;
  status: BrewStepStatus;
  /** Cumulative seconds elapsed before this step starts, summed from prior timed steps' durations. */
  startSeconds: number;
}
