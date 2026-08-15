import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import "../link-card/brew-link-card";
import "../text-field/brew-text-field";
import { INFO_ICON_SVG } from "../../shared/icons/icons";
import { EspressoCalculatorStyles } from "./espresso-calculator.styles";

/**
 * # Espresso Calculator
 * The espresso-specific input cluster shown on the Calculator screen in
 * place of `<brew-ratio-form>` when "Espresso Shot" is selected: dose in
 * (g), a coffee:water ratio field, and dose out / shot yield (g) - a
 * dose-in/ratio/dose-out model instead of pour-over's water/cup-size/ratio
 * one, since a real double shot is ~18g in, not "6oz of water".
 *
 * Also renders a static "Dial it in" troubleshooting card and a link to the
 * Espresso Recipes screen for browsing named shot styles/profiles - neither
 * needs props, they're the same for every render.
 *
 * This is a *controlled* component, same contract as `<brew-ratio-form>`:
 * it doesn't do the dose-in/ratio/dose-out linking math itself, it just
 * renders whatever `doseIn`/`ratio`/`doseOut` it's given and emits a
 * `*-change` event per field. The consumer owns the actual state and the
 * linking logic (see `espresso-calculator.store.ts`'s
 * `setEspressoDoseIn`/`setEspressoRatio`/`setEspressoDoseOut` for the
 * reference implementation).
 * ## Usage
 * ```html
 * <brew-espresso-calculator
 *   dose-in="${doseIn}"
 *   ratio="${ratio}"
 *   dose-out="${doseOut}"
 *   @dose-in-change="${(e) => setEspressoDoseIn(e.detail)}"
 *   @ratio-change="${(e) => setEspressoRatio(e.detail)}"
 *   @dose-out-change="${(e) => setEspressoDoseOut(e.detail)}"
 * ></brew-espresso-calculator>
 * ```
 * @element brew-espresso-calculator
 * @fires dose-in-change - `CustomEvent<string>` fired with the new dose-in (g) field value.
 * @fires ratio-change - `CustomEvent<string>` fired with the new ratio field value.
 * @fires dose-out-change - `CustomEvent<string>` fired with the new dose-out (g) field value.
 */
export class EspressoCalculator extends LitElement {
  static styles = [EspressoCalculatorStyles];

  @property({ type: Number, attribute: "dose-in" }) doseIn = 18;
  @property({ type: Number }) ratio = 2;
  @property({ type: Number, attribute: "dose-out" }) doseOut = 36;

  private _emit(name: "dose-in-change" | "ratio-change" | "dose-out-change", value: string): void {
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
        label="Dose in (g)"
        type="number"
        min="0"
        .value="${String(this.doseIn)}"
        @value-change="${(e: CustomEvent<string>) => this._emit("dose-in-change", e.detail)}"
      ></brew-text-field>

      <brew-text-field
        label="Coffee : Water ratio"
        type="number"
        min="0"
        prefix-text="1:"
        .value="${String(this.ratio)}"
        @value-change="${(e: CustomEvent<string>) => this._emit("ratio-change", e.detail)}"
      ></brew-text-field>

      <brew-text-field
        label="Dose out / shot yield (g)"
        type="number"
        min="0"
        .value="${String(this.doseOut)}"
        @value-change="${(e: CustomEvent<string>) => this._emit("dose-out-change", e.detail)}"
      ></brew-text-field>

      <div class="dial-in-card">
        <div class="dial-in-header">
          <brew-icon .svg="${INFO_ICON_SVG}" size="20"></brew-icon>
          <span class="dial-in-title">Dial it in</span>
        </div>
        <ul class="dial-in-list">
          <li><strong>Sour / thin:</strong> grind finer, or raise the dose.</li>
          <li><strong>Bitter / harsh:</strong> grind coarser, or shorten the shot time.</li>
          <li><strong>Weak / watery:</strong> lower the ratio, or check for channeling.</li>
          <li>
            <strong>Sputtering / channeling:</strong> redistribute and tamp more evenly, or check
            your dose.
          </li>
          <li>Adjust to taste — if it tastes good, the numbers are just numbers.</li>
        </ul>
      </div>

      <brew-link-card
        href="/more/espresso-recipes"
        icon="menu_book"
        label="Shot style reference"
        description="Ristretto, lungo, and more named styles &amp; profiles"
      ></brew-link-card>
    `;
  }
}
