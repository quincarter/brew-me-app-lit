import { type HTMLTemplateResult, html } from "lit";
import type {
  IBrewStep,
  IBrewStepsConfig,
  ILoadedRecipeSource,
} from "../interfaces/brew.interface";

/**
 * Which version of a brew's steps `<brew-steps-card>` should show wherever
 * a brew has `recipeSource` provenance to compare against - the current
 * (possibly hand-edited) steps, the original curated recipe's steps
 * untouched, or a merged view flagging what changed between the two.
 */
export type BrewStepsViewMode = "modified" | "original" | "diff";

/**
 * Narrower 2-way mode for the "Original recipe" bottom sheet only (opened
 * from `renderRecipeProvenanceBanner`) - unlike the inline Brew Steps card's
 * `BrewStepsViewMode` above, this sheet has no use for "Modified" (that's
 * just the brew's own current steps, already shown inline elsewhere), so it
 * only ever toggles between the curated recipe card and that same card's
 * diff treatment. See `recipe-provenance.utility.ts`'s `renderOriginalRecipeSheet`.
 */
export type RecipeSheetViewMode = "original" | "diff";

/** Shared render for a segmented toggle in the `BrewStepsViewToggleStyles` visual language - parameterized by its option list so `renderBrewStepsViewToggle`/`renderRecipeSheetViewToggle` don't duplicate the markup for their differing option counts. */
const renderViewToggle = <TMode extends string>(
  options: ReadonlyArray<{ mode: TMode; label: string }>,
  mode: TMode,
  onChange: (mode: TMode) => void,
): HTMLTemplateResult => html`
  <div class="brew-steps-view-toggle" role="tablist" aria-label="Brew steps view">
    ${options.map(
      (option) => html`
        <button
          type="button"
          role="tab"
          class="brew-steps-view-toggle-btn ${mode === option.mode ? "active" : ""}"
          aria-selected="${mode === option.mode}"
          @click="${() => onChange(option.mode)}"
        >
          ${option.label}
        </button>
      `,
    )}
  </div>
`;

const VIEW_MODE_OPTIONS: ReadonlyArray<{ mode: BrewStepsViewMode; label: string }> = [
  { mode: "modified", label: "Modified" },
  { mode: "original", label: "Original" },
  { mode: "diff", label: "Diff" },
];

/**
 * Small 3-way segmented control (Modified / Original / Diff), rendered
 * inline wherever a brew has `recipeSource` provenance to compare against.
 * Renders directly into the calling component's own shadow DOM (like
 * `renderRecipeProvenanceBanner`/`renderOriginalRecipeSheet`) rather than as
 * a nested custom element - style it via the shared `BrewStepsViewToggleStyles`
 * module, imported into each consumer's own `static styles`.
 */
export const renderBrewStepsViewToggle = (
  mode: BrewStepsViewMode,
  onChange: (mode: BrewStepsViewMode) => void,
): HTMLTemplateResult => renderViewToggle(VIEW_MODE_OPTIONS, mode, onChange);

const RECIPE_SHEET_VIEW_MODE_OPTIONS: ReadonlyArray<{ mode: RecipeSheetViewMode; label: string }> =
  [
    { mode: "original", label: "Original" },
    { mode: "diff", label: "Diff" },
  ];

/**
 * 2-way segmented control (Original / Diff) for the "Original recipe" sheet
 * only - same visual language as `renderBrewStepsViewToggle`
 * (`BrewStepsViewToggleStyles`), just fewer segments and no "Modified".
 */
export const renderRecipeSheetViewToggle = (
  mode: RecipeSheetViewMode,
  onChange: (mode: RecipeSheetViewMode) => void,
): HTMLTemplateResult => renderViewToggle(RECIPE_SHEET_VIEW_MODE_OPTIONS, mode, onChange);

/**
 * Resolves what to pass to `<brew-steps-card>`'s `.config`/`.diffAgainst`
 * for a given `BrewStepsViewMode`, given a brew's own steps and its curated
 * recipe provenance (if any).
 */
export const resolveBrewStepsForMode = (
  brewSteps: IBrewStepsConfig | null | undefined,
  recipeSource: ILoadedRecipeSource | null | undefined,
  mode: BrewStepsViewMode,
): { config: IBrewStepsConfig | null; diffAgainst: IBrewStep[] | null } => {
  if (mode === "original") {
    return {
      config: recipeSource ? { steps: recipeSource.steps } : null,
      diffAgainst: null,
    };
  }

  if (mode === "diff") {
    return {
      config: brewSteps ?? null,
      diffAgainst: recipeSource?.steps ?? null,
    };
  }

  return { config: brewSteps ?? null, diffAgainst: null };
};
