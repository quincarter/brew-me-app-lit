import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type {
  IBrewStep,
  IEspressoProfile,
  IEspressoShotStyle,
} from "../../shared/interfaces/brew.interface";
import {
  computeBrewStepsDiff,
  findMovedStepIds,
  type IBrewStepsDiff,
} from "../../shared/utilities/brew-steps-diff.utility";
import {
  getEspressoRecipeLabel,
  getEspressoRecipeSteps,
} from "../../shared/utilities/espresso-recipe.utility";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import "../button/brew-button";
import "../icon/brew-icon";
import { EspressoRecipeCardStyles } from "./espresso-recipe-card.styles";
import { EXPAND_LESS_ICON_SVG } from "../../shared/icons/expand-less.svg";
import { EXPAND_MORE_ICON_SVG } from "../../shared/icons/expand-more.svg";

type DiffState = "changed" | "added" | "removed" | null;

/**
 * # Espresso Recipe Card
 * An expandable card for a single curated espresso shot style or technique
 * profile: collapsed it shows the label/name plus ratio and dose-in/dose-out
 * badges; expanded it reveals the 4-row Brew Steps sequence (grind, water
 * temp, preinfusion, shot time) and a "Brew this recipe now" action. Unlike
 * `RecipeCard`/`PourOverRecipeCard`, an espresso recipe has no separate Setup
 * table or raw-prose Method - `IEspressoShotStyle`/`IEspressoProfile` are
 * flat numeric/label records whose only step-shaped representation is
 * `getEspressoRecipeSteps`'s `IBrewStep[]`, so that's the whole expanded
 * body, diffed and annotated in place rather than split into a plain list
 * plus a separate "Changes" summary.
 * @element brew-espresso-recipe-card
 * @fires brew-now - `CustomEvent<IEspressoShotStyle | IEspressoProfile>` fired with this card's recipe when "Brew this recipe now" is activated.
 */
export class EspressoRecipeCard extends LitElement {
  static styles = [EspressoRecipeCardStyles];

  @property({ type: Object }) recipe!: IEspressoShotStyle | IEspressoProfile;

  /** Seeds the initial expanded state only; after mount the toggle owns it. */
  @property({ type: Boolean, attribute: "start-open" }) startOpen = false;

  @property({ type: Boolean, attribute: "hide-brew-button" }) hideBrewButton = false;

  /**
   * When set, renders a merged diff of this recipe's own canonical
   * `getEspressoRecipeSteps(recipe)` against this array, annotating each row
   * in place (old → new, Changed/Added/Removed/Moved badges) - the
   * "Original recipe" sheet's Diff mode (`recipe-provenance.utility.ts`).
   * Null (the default) leaves every other consumer of this card (e.g. the
   * Espresso Recipes browser screen) completely unchanged.
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
      new CustomEvent<IEspressoShotStyle | IEspressoProfile>("brew-now", {
        detail: this.recipe,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _methodValueText(step: IBrewStep): string {
    return step.kind === "timed"
      ? typeof step.seconds === "number"
        ? formatSeconds(step.seconds)
        : "Now"
      : (step.value ?? "");
  }

  /**
   * One row in the primary (and only) step list - a plain row when
   * `diffState`/`moved` are unset, or `RecipeCard`'s "Changes" row treatment
   * (old → new, a diff badge) when this row actually differs from
   * `diffAgainst`. Reused for every row (not just diffed ones) since, unlike
   * the other two cards, there's no separate raw-prose Method list this can
   * fall back to.
   */
  private _renderStepRow(
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

  private _renderSteps(
    canonicalSteps: IBrewStep[],
    diff: IBrewStepsDiff | null,
  ): HTMLTemplateResult[] {
    if (!diff || !this.diffAgainst) {
      return canonicalSteps.map((step) => this._renderStepRow(step, null, false, null));
    }

    const diffAgainst = this.diffAgainst;
    const currentById = new Map(diffAgainst.map((step) => [step.id, step]));
    const changedIds = new Set((diff.changed ?? []).map((change) => change.id));
    const removedIds = new Set(diff.removed ?? []);
    const movedIds = findMovedStepIds(canonicalSteps, diffAgainst);

    const rows: HTMLTemplateResult[] = [];

    for (const canonical of canonicalSteps) {
      if (removedIds.has(canonical.id)) {
        rows.push(this._renderStepRow(canonical, "removed", false, null));
        continue;
      }
      const current = currentById.get(canonical.id);
      if (!current) continue;
      const changed = changedIds.has(canonical.id);
      const moved = movedIds.has(canonical.id);
      rows.push(
        this._renderStepRow(current, changed ? "changed" : null, moved, changed ? canonical : null),
      );
    }

    for (const added of diff.added ?? []) {
      rows.push(this._renderStepRow(added, "added", false, null));
    }

    return rows;
  }

  render(): HTMLTemplateResult {
    if (!this.recipe) return html``;

    const recipe = this.recipe;
    const profile = "preinfusionSec" in recipe ? (recipe as IEspressoProfile) : null;
    const label = getEspressoRecipeLabel(recipe);
    const canonicalSteps = getEspressoRecipeSteps(recipe);

    const rawDiff = this.diffAgainst
      ? computeBrewStepsDiff(canonicalSteps, this.diffAgainst)
      : null;
    // An unmodified brew (diffAgainst set, but identical to the recipe's own
    // canonical steps) has nothing to actually show a diff *of* - falling
    // through to the plain row list here avoids presenting an unmodified
    // recipe as if something had changed.
    const diff =
      rawDiff &&
      (rawDiff.changed?.length || rawDiff.added?.length || rawDiff.removed?.length || rawDiff.order)
        ? rawDiff
        : null;
    const stepRows = this._renderSteps(canonicalSteps, diff);

    return html`
      <div class="card ${this._expanded ? "expanded" : ""}">
        <button
          class="header"
          type="button"
          @click="${this._toggle}"
          aria-expanded="${this._expanded}"
        >
          <span class="who">
            <span class="label">${label}</span>
            <span class="badges">
              <span class="badge ratio-badge">1:${recipe.ratio}</span>
              <span class="badge dose-badge">${recipe.doseIn}g in</span>
              <span class="badge dose-badge">${recipe.doseOut}g out</span>
            </span>
          </span>
          <brew-icon
            .svg="${this._expanded ? EXPAND_LESS_ICON_SVG : EXPAND_MORE_ICON_SVG}"
          ></brew-icon>
        </button>

        ${
          this._expanded
            ? html`
                <div class="body">
                  <div class="method-title">Steps</div>
                  <ul class="steps">
                    ${stepRows}
                  </ul>

                  ${profile ? html`<p class="tagline">${profile.tagline}</p>` : nothing}
                  ${profile?.note ? html`<p class="note">${profile.note}</p>` : nothing}
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
