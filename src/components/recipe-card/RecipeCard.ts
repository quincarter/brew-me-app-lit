import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { IAeropressRecipe, IBrewStep } from "../../shared/interfaces/brew.interface";
import { getAeropressRecipeSteps } from "../../shared/utilities/aeropress-recipe.utility";
import {
  computeBrewStepsDiff,
  findMovedStepIds,
  type IBrewStepsDiff,
} from "../../shared/utilities/brew-steps-diff.utility";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import "../button/brew-button";
import "../icon/brew-icon";
import { RecipeCardStyles } from "./recipe-card.styles";

const PLACE_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

type DiffState = "changed" | "added" | "removed" | null;

/**
 * # Recipe Card
 * An expandable card for a single World AeroPress Championship recipe:
 * collapsed it shows the placing, competitor and year; expanded it reveals
 * the full setup table, numbered method, and a "Brew this recipe now"
 * action. A *controlled* component like `brew-steps-card`/`brew-list-row`:
 * it doesn't save anything itself - the consumer (the WAC Recipes screen)
 * owns what "brew this now" actually does.
 * @element brew-recipe-card
 * @fires brew-now - `CustomEvent<IAeropressRecipe>` fired with this card's recipe when "Brew this recipe now" is activated.
 */
export class RecipeCard extends LitElement {
  static styles = [RecipeCardStyles];

  @property({ type: Object }) recipe!: IAeropressRecipe;

  /** Seeds the initial expanded state only; after mount the toggle owns it. */
  @property({ type: Boolean, attribute: "start-open" }) startOpen = false;

  @property({ type: Boolean, attribute: "hide-brew-button" }) hideBrewButton = false;

  /**
   * When set, renders a merged diff of this recipe's own canonical curated
   * steps (`getAeropressRecipeSteps(recipe)`) against this array instead of
   * the plain Setup table / raw-prose Method list - the "Original recipe"
   * sheet's Diff mode (`recipe-provenance.utility.ts`). Null (the default)
   * leaves every other consumer of this card (e.g. the WAC Recipes browser
   * screen) completely unchanged.
   */
  @property({ type: Array }) diffAgainst: IBrewStep[] | null = null;

  @state() private _expanded = false;

  private _seeded = false;

  connectedCallback(): void {
    super.connectedCallback();
    // Seed once. Guarded so re-connecting (e.g. a list re-order) doesn't
    // discard an expand/collapse the user has since made.
    if (!this._seeded) {
      this._seeded = true;
      this._expanded = this.startOpen;
    }
  }

  private _toggle = (): void => {
    this._expanded = !this._expanded;
  };

  private _onBrewNow = (): void => {
    this.dispatchEvent(
      new CustomEvent<IAeropressRecipe>("brew-now", {
        detail: this.recipe,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _renderSetupRow(
    key: string,
    value: string,
    diff: IBrewStepsDiff | null,
  ): HTMLTemplateResult {
    const id = `${this.recipe.id}-setup-${key}`;
    const removed = diff?.removed?.includes(id) ?? false;
    const changed = diff?.changed?.some((change) => change.id === id) ?? false;

    if (removed) {
      return html`
        <div class="setup-row setup-row-removed">
          <dt>${key}</dt>
          <dd>
            <span class="diff-old">${value}</span>
            <span class="diff-badge">Removed</span>
          </dd>
        </div>
      `;
    }

    if (changed) {
      const newValue = this.diffAgainst?.find((step) => step.id === id)?.value ?? value;
      return html`
        <div class="setup-row setup-row-changed">
          <dt>${key}</dt>
          <dd>
            <span class="diff-old">${value}</span>
            <span class="diff-arrow">→</span>
            <span class="diff-new">${newValue}</span>
            <span class="diff-badge">Changed</span>
          </dd>
        </div>
      `;
    }

    return html`
      <div class="setup-row">
        <dt>${key}</dt>
        <dd>${value}</dd>
      </div>
    `;
  }

  private _methodValueText(step: IBrewStep): string {
    return step.kind === "timed"
      ? typeof step.seconds === "number"
        ? formatSeconds(step.seconds)
        : "Now"
      : (step.value ?? "");
  }

  /**
   * One row in the "Changes" list below the full Method prose - unlike the
   * plain read row, a changed row shows old → new (mirroring
   * `_renderSetupRow`) rather than just its current value, since this row
   * only appears here *because* something about it differs and the reader
   * has no other way to see what the old value was.
   */
  private _renderMethodChangeRow(
    step: IBrewStep,
    diffState: DiffState,
    moved: boolean,
    original: IBrewStep | null,
  ): HTMLTemplateResult {
    const currentText = this._methodValueText(step);
    const diffLabel =
      diffState === "changed" ? "Changed" : diffState === "added" ? "Added" : "Removed";

    return html`
      <li class="${diffState ? `step-${diffState}` : ""} ${moved ? "step-moved" : ""}">
        <span class="step-line-label">${step.label}</span>
        ${
          diffState === "changed" && original
            ? html`
                <span class="diff-old">${this._methodValueText(original)}</span>
                <span class="diff-arrow">→</span>
                <span class="diff-new">${currentText}</span>
              `
            : currentText
              ? html`<span class="step-line-value">${currentText}</span>`
              : nothing
        }
        ${diffState ? html`<span class="diff-badge">${diffLabel}</span>` : nothing}
        ${moved ? html`<span class="diff-badge diff-badge-moved">Moved</span>` : nothing}
      </li>
    `;
  }

  /**
   * The "Changes" list shown below the full raw-prose Method - unlike the
   * Setup table (where the diff annotates rows in place, so it can safely
   * replace the plain view), the Method section's diffable representation
   * (this recipe's curated `timedSteps`) is a coarser, differently-worded
   * summary of the same brew than the raw prose `steps` list, with no
   * per-line correspondence between the two. Swapping the whole Method
   * section to that coarser list for *any* diff - even a single changed
   * duration - made an actually-modified recipe look like a shorter,
   * different recipe purely from the format switch, with nothing to
   * explain why the sentence count dropped. So the raw prose always stays
   * (identical to Original mode, in `render()`), and this returns only the
   * rows that actually differ - a change, addition, removal, or reorder -
   * as a short, separate, clearly-labeled summary underneath. Unmoved,
   * unchanged rows are skipped entirely, only ever surfacing what's
   * genuinely different.
   */
  private _renderMethodChanges(diff: IBrewStepsDiff): HTMLTemplateResult[] {
    if (!this.diffAgainst) return [];

    // `getAeropressRecipeSteps` returns setup rows *and* brew steps as one
    // flat array (that's what makes a single `computeBrewStepsDiff` call
    // cover both sections) - the Setup `<dl>` above already renders the
    // `${recipe.id}-setup-*` rows, so exclude them here or they'd leak
    // into the Method changes list too.
    const setupPrefix = `${this.recipe.id}-setup-`;
    const canonicalSteps = getAeropressRecipeSteps(this.recipe).filter(
      (step) => !step.id.startsWith(setupPrefix),
    );
    // `diffAgainst` needs the same setup-row exclusion as `canonicalSteps`
    // before comparing relative order, or a mismatched "one side still has
    // setup rows" array would produce bogus moved-row results.
    const diffAgainstMethodSteps = this.diffAgainst.filter(
      (step) => !step.id.startsWith(setupPrefix),
    );
    const currentById = new Map(this.diffAgainst.map((step) => [step.id, step]));
    const changedIds = new Set((diff.changed ?? []).map((change) => change.id));
    const removedIds = new Set(diff.removed ?? []);
    const movedIds = findMovedStepIds(canonicalSteps, diffAgainstMethodSteps);

    const rows: HTMLTemplateResult[] = [];

    for (const canonical of canonicalSteps) {
      if (removedIds.has(canonical.id)) {
        rows.push(this._renderMethodChangeRow(canonical, "removed", false, null));
        continue;
      }
      const current = currentById.get(canonical.id);
      if (!current) continue;
      const changed = changedIds.has(canonical.id);
      const moved = movedIds.has(canonical.id);
      if (!changed && !moved) continue;
      rows.push(this._renderMethodChangeRow(current, changed ? "changed" : null, moved, canonical));
    }

    for (const added of diff.added ?? []) {
      rows.push(this._renderMethodChangeRow(added, "added", false, null));
    }

    return rows;
  }

  render(): HTMLTemplateResult {
    if (!this.recipe) return html``;

    const { year, place, competitor, country, setup, steps, note } = this.recipe;
    const placeLabel = PLACE_LABEL[place] ?? `${place}th`;

    const rawDiff = this.diffAgainst
      ? computeBrewStepsDiff(getAeropressRecipeSteps(this.recipe), this.diffAgainst)
      : null;
    // An unmodified brew (diffAgainst set, but identical to the recipe's own
    // canonical steps) has nothing to actually show a diff *of* - falling
    // through to the raw-prose Method list here, same as Original mode,
    // avoids presenting the curated phase-based list (a real but different
    // representation of the same unmodified recipe) as if something had
    // changed or been lost.
    const diff =
      rawDiff &&
      (rawDiff.changed?.length || rawDiff.added?.length || rawDiff.removed?.length || rawDiff.order)
        ? rawDiff
        : null;
    const methodChanges = diff ? this._renderMethodChanges(diff) : [];

    return html`
      <div class="card ${this._expanded ? "expanded" : ""}">
        <button
          class="header"
          type="button"
          @click="${this._toggle}"
          aria-expanded="${this._expanded}"
        >
          <span class="place place-${place}">${placeLabel}</span>
          <span class="who">
            <span class="competitor">${competitor}</span>
            <span class="country">${country} · ${year}</span>
          </span>
          <brew-icon name="${this._expanded ? "expand_less" : "expand_more"}"></brew-icon>
        </button>

        ${
          this._expanded
            ? html`
                <div class="body">
                  <dl class="setup">
                    ${Object.entries(setup).map(([key, value]) =>
                      this._renderSetupRow(key, value, diff),
                    )}
                  </dl>

                  <div class="method-title">Method</div>
                  <ol class="steps">
                    ${steps.map((step) => html`<li>${step}</li>`)}
                  </ol>

                  ${
                    methodChanges.length > 0
                      ? html`
                          <div class="method-title changes-title">Changes</div>
                          <ul class="steps steps-changes">
                            ${methodChanges}
                          </ul>
                        `
                      : nothing
                  }
                  ${note ? html`<p class="note">${note}</p>` : nothing}
                  ${
                    !this.hideBrewButton
                      ? html`<brew-button
                          variant="filled"
                          full-width
                          @button-click="${this._onBrewNow}"
                          ><brew-icon name="coffee" size="18"></brew-icon> Brew this recipe
                          now</brew-button
                        >`
                      : nothing
                  }
                </div>
              `
            : nothing
        }
      </div>
    `;
  }
}
