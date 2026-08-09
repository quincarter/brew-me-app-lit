import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import "../text-field/brew-text-field";
import { RatioFormStyles } from "./ratio-form.styles";

/**
 * # Ratio Form
 * The water:coffee ratio input cluster - a ratio field, a linked Water (g) /
 * Cup size (oz) row, and a live "coffee needed" result - shared by the
 * Calculator screen and the Saved Ratio Detail screen's edit mode so both
 * inputs look and behave identically.
 *
 * This is a *controlled* component: it doesn't do the water/oz/ratio linking
 * math itself, it just renders whatever `ratio`/`water`/`oz`/`coffee` it's
 * given and emits a `*-change` event per field. The consumer owns the actual
 * state and the linking logic (see `calculator.store.ts`'s
 * `setRatio`/`setWater`/`setOz` for the reference implementation), so both
 * the global ephemeral calculator state and a saved brew's local edit state
 * can drive the same markup.
 * ## Usage
 * ```html
 * <brew-ratio-form
 *   ratio="${ratio}"
 *   water="${water}"
 *   oz="${oz}"
 *   .coffee="${coffee}"
 *   @ratio-change="${(e) => setRatio(e.detail)}"
 *   @water-change="${(e) => setWater(e.detail)}"
 *   @oz-change="${(e) => setOz(e.detail)}"
 * ></brew-ratio-form>
 * ```
 * @element brew-ratio-form
 * @fires ratio-change - `CustomEvent<string>` fired with the new ratio field value.
 * @fires water-change - `CustomEvent<string>` fired with the new water (g) field value.
 * @fires oz-change - `CustomEvent<string>` fired with the new cup size (oz) field value.
 */
export class RatioForm extends LitElement {
  static styles = [RatioFormStyles];

  @property({ type: String }) ratio = "16";
  @property({ type: String }) water = "";
  @property({ type: String }) oz = "";
  @property({ type: Number }) coffee: number | null = null;

  private _emit(name: "ratio-change" | "water-change" | "oz-change", value: string): void {
    this.dispatchEvent(
      new CustomEvent<string>(name, {
        detail: value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render(): HTMLTemplateResult {
    return html`
      <brew-text-field
        label="Coffee : Water ratio"
        type="number"
        prefix-text="1:"
        .value="${this.ratio}"
        @value-change="${(e: CustomEvent<string>) => this._emit("ratio-change", e.detail)}"
      ></brew-text-field>
      <p class="hint">
        Defaults to 1:16 for pour-over &amp; drip. Try 1:2 for espresso, 1:3–5 for cold brew.
      </p>

      <div class="row">
        <brew-text-field
          label="Water (g)"
          type="number"
          .value="${this.water}"
          @value-change="${(e: CustomEvent<string>) => this._emit("water-change", e.detail)}"
        ></brew-text-field>
        <brew-text-field
          label="Cup size (oz)"
          type="number"
          .value="${this.oz}"
          @value-change="${(e: CustomEvent<string>) => this._emit("oz-change", e.detail)}"
        ></brew-text-field>
      </div>
      <p class="hint">These two fields update each other automatically.</p>

      ${
        this.coffee !== null
          ? html`
              <div class="result">
                <div class="result-label">Coffee needed</div>
                <div class="result-value">${this.coffee}g</div>
              </div>
            `
          : nothing
      }
    `;
  }
}
