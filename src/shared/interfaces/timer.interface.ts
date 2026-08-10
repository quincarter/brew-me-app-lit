/** A recipe the Timer screen was primed with via the Calculator's "Start guided timer" action. */
export interface IPrimedRecipe {
  name: string;
  coffee: number;
  water: number;
  /** Coffee:water ratio, e.g. `16` for a 1:16 brew - shown alongside the name in the Timer's recipe caption. */
  ratio: number;
  /** Total target brew time in seconds, or null for a plain count-up stopwatch (e.g. Cold Brew, or an unmatched/custom brew type). */
  targetSeconds: number | null;
}
