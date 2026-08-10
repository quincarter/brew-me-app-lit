import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { AEROPRESS_RECIPES } from "../../shared/data/aeropress-recipes.data";
import type { IAeropressRecipe } from "../../shared/interfaces/brew.interface";
import "../bottom-sheet/brew-bottom-sheet";
import "../list-row/brew-list-row";
import { RecipePickerSheetStyles } from "./recipe-picker-sheet.styles";

const PLACE_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

/**
 * # Recipe Picker Sheet
 * AeroPress-only: a `<brew-bottom-sheet>` listing every curated World
 * AeroPress Championship recipe (`AEROPRESS_RECIPES`) as a tappable row.
 * Picking one fires `recipe-select` with the full recipe so the consumer
 * (the Calculator) can auto-fill its numbers and Brew Steps card - this
 * component is just the list, the same "dumb shell + one event" shape
 * `brew-save-sheet` uses for the save flow. Kept as its own component
 * rather than inlined in `calculator-page.ts`, which is already sizable.
 * @element brew-recipe-picker-sheet
 * @fires recipe-select - `CustomEvent<IAeropressRecipe>` fired with the tapped recipe. Consumers are responsible for closing the sheet.
 */
export class RecipePickerSheet extends LitElement {
  static styles = [RecipePickerSheetStyles];

  @property({ type: Boolean }) open = false;

  private _select(event: Event, recipe: IAeropressRecipe): void {
    // Suppresses `brew-list-row`'s default navigation (it renders as an <a>)
    // before the router's own document-level click listener sees it.
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent<IAeropressRecipe>("recipe-select", {
        detail: recipe,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render(): HTMLTemplateResult {
    if (!this.open) return html``;

    return html`
      <brew-bottom-sheet ?open="${this.open}" label="Load a WAC recipe">
        <div class="title">Load a WAC recipe</div>
        <p class="hint">Auto-fills the ratio, water, and coffee from the selected recipe.</p>
        <div class="list">
          ${AEROPRESS_RECIPES.map((recipe) => {
            const placeLabel = PLACE_LABEL[recipe.place] ?? `${recipe.place}th`;
            return html`
              <brew-list-row
                headline="${recipe.competitor} · ${recipe.year}"
                supporting="${placeLabel} place · ${recipe.doseGrams}g coffee : ${recipe.totalWaterGrams}g water"
                leading-initial="${recipe.competitor.charAt(0)}"
                @click="${(e: Event) => this._select(e, recipe)}"
              ></brew-list-row>
            `;
          })}
        </div>
      </brew-bottom-sheet>
    `;
  }
}
