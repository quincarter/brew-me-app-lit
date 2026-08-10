import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { BottomSheetStyles } from "./bottom-sheet.styles";

/**
 * # Bottom Sheet
 * A generic bottom-sheet/modal shell - a mobile bottom sheet below the
 * 840px breakpoint, a centered modal dialog above it. Dumb by design: it
 * owns no state beyond `open`/`label` and just slots whatever content a
 * consumer (e.g. `brew-save-sheet`, `brew-post-save-sheet`) gives it.
 * @element brew-bottom-sheet
 * @slot - Sheet content.
 * @fires sheet-scrim-click - Fired when the scrim (outside the sheet) is clicked. Consumers decide whether that should close the sheet.
 */
export class BottomSheet extends LitElement {
  static styles = [BottomSheetStyles];

  @property({ type: Boolean }) open = false;
  @property({ type: String }) label = "";

  private _onScrimClick = (): void => {
    this.dispatchEvent(new CustomEvent("sheet-scrim-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    if (!this.open) return html``;

    return html`
      <div class="scrim" @click="${this._onScrimClick}">
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="${this.label}"
          @click="${(e: Event) => e.stopPropagation()}"
        >
          <slot></slot>
        </div>
      </div>
    `;
  }
}
