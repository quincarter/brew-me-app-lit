import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { IPrimedRecipe } from "../../shared/interfaces/timer.interface";
import type { GuidedTimerMode } from "../../shared/stores/timer.store";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import "../brew-steps-card/brew-steps-card";
import "../button/brew-button";
import "../chip/brew-chip";
import "../icon/brew-icon";
import "../text-field/brew-text-field";
import { TimerRecipePanelStyles } from "./timer-recipe-panel.styles";

/**
 * # Timer Recipe Panel
 * The Timer screen's guided-brew section: the primed recipe's name/ratio/
 * amounts caption, the count-down/count-up mode toggle (with a target-
 * minutes field while counting down), and - when the recipe has step data -
 * its Brew Steps card. Renders nothing when `recipe` is null; the page only
 * mounts this element once a recipe is primed, so that's a defensive
 * fallback rather than the primary gate.
 * @element brew-timer-recipe-panel
 * @fires mode-change - `CustomEvent<GuidedTimerMode>` fired when the count-down/count-up toggle is clicked.
 * @fires target-change - `CustomEvent<string>` fired with the raw target-minutes field value on input.
 */
export class TimerRecipePanel extends LitElement {
  static styles = [TimerRecipePanelStyles];

  @property({ type: Object }) recipe: IPrimedRecipe | null = null;
  @property({ type: String }) mode: GuidedTimerMode = "countdown";
  @property({ type: Number, attribute: "elapsed-seconds" }) elapsedSeconds = 0;

  @state() private _editingTarget = false;

  private _emitModeChange(mode: GuidedTimerMode): void {
    this.dispatchEvent(
      new CustomEvent<GuidedTimerMode>("mode-change", {
        detail: mode,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _emitTargetChange(value: string): void {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed < 0) {
      this.dispatchEvent(
        new CustomEvent<string>("target-change", { detail: "0", bubbles: true, composed: true }),
      );
      return;
    }
    this.dispatchEvent(
      new CustomEvent<string>("target-change", { detail: value, bubbles: true, composed: true }),
    );
  }

  private _formatTargetMinutes(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return "0 min";
    const minutes = Math.round((seconds / 60) * 100) / 100;
    return `${minutes} min target`;
  }

  render(): HTMLTemplateResult | typeof nothing {
    if (!this.recipe) return nothing;
    const { recipe, mode } = this;
    const targetSeconds = recipe.targetSeconds ?? 0;

    return html`
      <div class="recipe-caption">
        <p class="recipe-caption-name">${recipe.name} · ${formatRatio(recipe.ratio)}</p>
        <p class="recipe-caption-detail">${recipe.coffee}g coffee · ${recipe.water}g water</p>
      </div>

      <div class="guided-options">
        <div class="mode-toggle-row">
          <div class="mode-toggle">
            <brew-chip
              label="Count down"
              ?selected="${mode === "countdown"}"
              @chip-click="${() => this._emitModeChange("countdown")}"
            ></brew-chip>
            <brew-chip
              label="Count up"
              ?selected="${mode === "countup"}"
              @chip-click="${() => this._emitModeChange("countup")}"
            ></brew-chip>
          </div>

          ${
            mode === "countdown" && !this._editingTarget
              ? html`
                  <button
                    type="button"
                    class="target-chip"
                    aria-label="Edit target duration, currently ${this._formatTargetMinutes(targetSeconds)}"
                    @click="${() => (this._editingTarget = true)}"
                  >
                    <span>${this._formatTargetMinutes(targetSeconds)}</span>
                    <brew-icon name="edit" size="14"></brew-icon>
                  </button>
                `
              : nothing
          }
        </div>

        ${
          mode === "countdown" && this._editingTarget
            ? html`
                <div class="target-edit-bar">
                  <brew-text-field
                    label="Target (minutes)"
                    type="number"
                    min="0"
                    .value="${String(Math.round(((recipe.targetSeconds ?? 0) / 60) * 100) / 100)}"
                    @value-change="${(e: CustomEvent<string>) => this._emitTargetChange(e.detail)}"
                  ></brew-text-field>
                  <brew-button
                    variant="text"
                    @button-click="${() => (this._editingTarget = false)}"
                    >Done</brew-button
                  >
                </div>
              `
            : nothing
        }
      </div>

      ${
        recipe.steps
          ? html`
              <brew-steps-card
                .config="${{ steps: recipe.steps }}"
                elapsed-seconds="${this.elapsedSeconds}"
              ></brew-steps-card>
            `
          : nothing
      }
    `;
  }
}
