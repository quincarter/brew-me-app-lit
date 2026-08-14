import { type HTMLTemplateResult, html, nothing } from "lit";
import "../../components/bottom-sheet/brew-bottom-sheet";
import "../../components/icon/brew-icon";
import type { IBrewStep, ILoadedRecipeSource } from "../interfaces/brew.interface";
import { type RecipeSheetViewMode, renderRecipeSheetViewToggle } from "./brew-steps-view.utility";
import { isRecipeModified, type IRecipeModifiedCurrent } from "./recipe-modified.utility";
import { type IRenderRecipeCardOptions, renderRecipeCard } from "./recipe-registry.utility";

/**
 * Shared "Pulled from {label}" / "Modified from {label} — tap to see the
 * original" banner, used by the Calculator, Saved Detail, and Share screens
 * wherever a brew carries `recipeSource` provenance. Renders directly into
 * the calling component's own shadow DOM rather than as a nested custom
 * element, so it stays reachable by a plain `shadowRoot.querySelector` from
 * the calling component's tests.
 */
export const renderRecipeProvenanceBanner = (
  source: ILoadedRecipeSource | null | undefined,
  current: IRecipeModifiedCurrent,
  onOpen: () => void,
): HTMLTemplateResult | typeof nothing => {
  if (!source) return nothing;

  const modified = isRecipeModified(current, source);

  return html`
    <button class="primed-banner recipe-banner" type="button" @click="${onOpen}">
      <brew-icon name="menu_book" size="18"></brew-icon>
      <span class="primed-banner-text"
        >${
          modified
            ? html`Modified from ${source.label} — tap to see the original`
            : html`Pulled from ${source.label}`
        }</span
      >
    </button>
  `;
};

/**
 * Companion "see the original" bottom sheet, opened by
 * `renderRecipeProvenanceBanner`'s `onOpen`. Above the body it renders a
 * 2-way Original/Diff `renderRecipeSheetViewToggle`, then branches the body
 * on `viewMode`:
 * - `"original"` (the default everywhere this is used): unchanged from
 *   before this toggle existed - the curated recipe card itself.
 * - `"diff"`: the same curated recipe card, with `currentSteps` passed as
 *   `.diffAgainst` so its own Setup/Method sections render the merged diff
 *   treatment in the card's own visual format (no `<brew-steps-card>`
 *   swap - see `RecipeCard`/`PourOverRecipeCard`'s doc comments).
 */
export const renderOriginalRecipeSheet = (
  source: ILoadedRecipeSource | null | undefined,
  isOpen: boolean,
  onClose: () => void,
  currentSteps: IBrewStep[],
  viewMode: RecipeSheetViewMode,
  onViewModeChange: (mode: RecipeSheetViewMode) => void,
  options?: IRenderRecipeCardOptions,
): HTMLTemplateResult | typeof nothing => {
  if (!isOpen || !source) return nothing;

  return html`
    <brew-bottom-sheet open label="Original recipe" @sheet-scrim-click="${onClose}">
      <div class="title">Original recipe</div>
      ${renderRecipeSheetViewToggle(viewMode, onViewModeChange)}
      ${renderRecipeCard(source.recipeId, {
        ...options,
        diffAgainst: viewMode === "diff" ? currentSteps : null,
      })}
    </brew-bottom-sheet>
  `;
};
