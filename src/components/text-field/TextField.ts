import { type HTMLTemplateResult, html, LitElement, nothing, type PropertyValues } from "lit";
import { property, query } from "lit/decorators.js";
import { TextFieldStyles } from "./text-field.styles";

/**
 * # Text Field
 * An outlined, labeled text input modeled after Material 3 text fields.
 * ## Usage
 * ```html
 * <brew-text-field label="Water (g)" type="number" .value="${value}" @value-change="${onChange}"></brew-text-field>
 * <brew-text-field label="Price" prefix-text="$" type="number" .value="${value}" @value-change="${onChange}"></brew-text-field>
 * ```
 * @element brew-text-field
 * @fires value-change - `CustomEvent<string>` fired on input with the new value.
 */
export class TextField extends LitElement {
  static styles = [TextFieldStyles];

  @property({ type: String }) label = "";
  @property({ type: String }) type: "text" | "number" = "text";
  @property({ type: String }) value = "";
  @property({ type: String, attribute: "prefix-text" }) prefixText = "";
  @property({ type: String, attribute: "suffix-text" }) suffixText = "";
  @property({ type: String }) name = "";
  @property({ type: String }) min = "";

  @query("input") private _input!: HTMLInputElement;

  private _onInput = (): void => {
    this.value = this._input.value;
    this.dispatchEvent(
      new CustomEvent<string>("value-change", {
        detail: this.value,
        bubbles: true,
        composed: true,
      }),
    );
  };

  /** Only writes `.value` to the input when it actually differs from what's
   * already there. Lit's template binding dirty-checks against the last
   * value *it* committed, not the live DOM - so a round trip through a
   * parent signal (same string coming back down) would otherwise reassign
   * `.value` to a string the input already has, which resets the cursor to
   * the start on a `type="number"` input. Reassigning only on a genuine
   * external change (e.g. Reset) keeps the cursor put while typing. */
  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has("value") && this._input.value !== this.value) {
      const { selectionStart, selectionEnd } = this._input;
      this._input.value = this.value;
      if (selectionStart !== null && selectionEnd !== null) {
        this._input.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  render(): HTMLTemplateResult {
    return html`
      <label class="field">
        <span class="label">${this.label}</span>
        <span class="control">
          ${this.prefixText ? html`<span class="prefix">${this.prefixText}</span>` : nothing}
          <input
            class="input"
            name="${this.name || nothing}"
            type="${this.type}"
            min="${this.min || nothing}"
            @input="${this._onInput}"
          />
          ${this.suffixText ? html`<span class="suffix">${this.suffixText}</span>` : nothing}
        </span>
      </label>
    `;
  }
}
