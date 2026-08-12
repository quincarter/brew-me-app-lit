import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import type { IOrigamiRecipe, IV60Recipe } from "../../shared/interfaces/brew.interface";
import "../avatar/brew-avatar";
import "../button/brew-button";
import "../icon/brew-icon";
import { PourOverRecipeCardStyles } from "./pourover-recipe-card.styles";

/**
 * # Pour-Over Recipe Card
 * An expandable card for a single named V60/Origami pour-over recipe: collapsed it
 * shows an avatar, the recipe title and its author; expanded it reveals
 * the full setup table, numbered method, and a "Brew this recipe now" action.
 * @element brew-pourover-recipe-card
 * @fires brew-now - `CustomEvent<IV60Recipe | IOrigamiRecipe>` fired with this card's recipe when "Brew this recipe now" is activated.
 */
export class PourOverRecipeCard extends LitElement {
  static styles = [PourOverRecipeCardStyles];

  @property({ type: Object }) recipe!: IV60Recipe | IOrigamiRecipe;

  /** Seeds the initial expanded state only; after mount the toggle owns it. */
  @property({ type: Boolean, attribute: "start-open" }) startOpen = false;

  @property({ type: Boolean, attribute: "hide-brew-button" }) hideBrewButton = false;

  @property({ type: String, attribute: "avatar-initial" }) avatarInitial = "";
  @property({ type: String, attribute: "avatar-bg" }) avatarBg =
    "var(--brew-color-secondary-container)";
  @property({ type: String, attribute: "avatar-fg" }) avatarFg =
    "var(--brew-color-on-secondary-container)";

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
      new CustomEvent<IV60Recipe | IOrigamiRecipe>("brew-now", {
        detail: this.recipe,
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): HTMLTemplateResult {
    if (!this.recipe) return html``;

    const { title, author, setup, steps, note } = this.recipe;

    return html`
      <div class="card ${this._expanded ? "expanded" : ""}">
        <button
          class="header"
          type="button"
          @click="${this._toggle}"
          aria-expanded="${this._expanded}"
        >
          <brew-avatar
            initial="${this.avatarInitial}"
            background="${this.avatarBg}"
            foreground="${this.avatarFg}"
            size="36"
          ></brew-avatar>
          <span class="who">
            <span class="title">${title}</span>
            <span class="author">${author}</span>
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
