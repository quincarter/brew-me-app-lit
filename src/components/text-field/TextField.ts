import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { property, query } from "lit/decorators.js";
import { TextFieldStyles } from "./text-field.styles";

/**
 * # Text Field
 * An outlined, labeled text input modeled after Material 3 text fields.
 * ## Usage
 * ```html
 * <brew-text-field label="Water (g)" type="number" .value="${value}" @value-change="${onChange}"></brew-text-field>
 * ```
 * @element brew-text-field
 * @fires value-change - `CustomEvent<string>` fired on input with the new value.
 */
export class TextField extends LitElement {
  static styles = [TextFieldStyles];

  @property({ type: String }) label = "";
  @property({ type: String }) type: "text" | "number" = "text";
  @property({ type: String }) value = "";
  @property({ type: String, attribute: "suffix-text" }) suffixText = "";
  @property({ type: String }) name = "";

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

  render(): HTMLTemplateResult {
    return html`
      <label class="field">
        <span class="label">${this.label}</span>
        <span class="control">
          <input
            class="input"
            name="${this.name || nothing}"
            type="${this.type}"
            .value="${this.value}"
            @input="${this._onInput}"
          />
          ${this.suffixText ? html`<span class="suffix">${this.suffixText}</span>` : nothing}
        </span>
      </label>
    `;
  }
}
