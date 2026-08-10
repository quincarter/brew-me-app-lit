import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { IAeropressRecipe } from "../../shared/interfaces/brew.interface";
import "../button/brew-button";
import "../icon/brew-icon";
import { RecipeCardStyles } from "./recipe-card.styles";

const PLACE_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

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

  render(): HTMLTemplateResult {
    if (!this.recipe) return html``;

    const { year, place, competitor, country, setup, steps, note } = this.recipe;
    const placeLabel = PLACE_LABEL[place] ?? `${place}th`;

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
                    ${Object.entries(setup).map(
                      ([key, value]) => html`
                        <div class="setup-row">
                          <dt>${key}</dt>
                          <dd>${value}</dd>
                        </div>
                      `,
                    )}
                  </dl>

                  <div class="method-title">Method</div>
                  <ol class="steps">
                    ${steps.map((step) => html`<li>${step}</li>`)}
                  </ol>

                  ${note ? html`<p class="note">${note}</p>` : nothing}

                  <brew-button variant="filled" full-width @button-click="${this._onBrewNow}"
                    ><brew-icon name="coffee" size="18"></brew-icon> Brew this recipe
                    now</brew-button
                  >
                </div>
              `
            : nothing
        }
      </div>
    `;
  }
}
