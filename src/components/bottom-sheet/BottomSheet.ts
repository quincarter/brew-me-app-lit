import { type HTMLTemplateResult, html, LitElement, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { BottomSheetStyles } from "./bottom-sheet.styles";

/**
 * # Bottom Sheet
 * A generic bottom-sheet/modal shell, built on the native `<dialog>` element
 * for top-layer rendering, a native `::backdrop`, and automatic focus
 * trapping/restoration - a mobile bottom sheet below the 840px breakpoint, a
 * centered modal dialog above it. Dumb by design: it owns no state beyond
 * `open`/`label` and just slots whatever content a consumer (e.g.
 * `brew-save-sheet`, `brew-post-save-sheet`) gives it.
 * @element brew-bottom-sheet
 * @slot - Sheet content.
 * @fires sheet-scrim-click - Fired when the user tries to dismiss the sheet from outside app control (clicking the backdrop or pressing Escape). Consumers decide whether that should close the sheet.
 */
export class BottomSheet extends LitElement {
  static styles = [BottomSheetStyles];

  @property({ type: Boolean }) open = false;
  @property({ type: String }) label = "";

  @query("dialog") private _dialog!: HTMLDialogElement;
  /**
   * True while the exit transition is playing. Native `HTMLDialogElement.close()`
   * removes a `<dialog>` from the top layer (and applies `display: none`)
   * synchronously, which skips any CSS exit transition entirely - relying on
   * `@starting-style`/`transition-behavior: allow-discrete` to defer that
   * removal is a very new CSS capability with inconsistent cross-browser
   * support (notably on Safari/iOS, which this app targets). Instead, a
   * close request adds the `closing` class (driving the dialog to its
   * closed *visual* styles via CSS while it's still technically open/in the
   * top layer, see `bottom-sheet.styles.ts`), waits for that transition to
   * actually finish, and only then calls the real `close()`.
   */
  @state() private _closing = false;

  private _dispatchScrimClick(): void {
    this.dispatchEvent(new CustomEvent("sheet-scrim-click", { bubbles: true, composed: true }));
  }

  /** Escape triggers "cancel" before the dialog would auto-close - prevent the default so `open` (owned by the consumer) stays the single source of truth for showModal()/close(). */
  private _onCancel = (event: Event): void => {
    event.preventDefault();
    this._dispatchScrimClick();
  };

  /** In case native dialog closes (e.g. browser dismissal), notify consumer if state was out of sync. */
  private _onClose = (): void => {
    if (this.open) {
      this._dispatchScrimClick();
    }
  };

  /**
   * Clicking the native backdrop dispatches a click on the dialog itself
   * with no descendant target, so a point-in-box check tells backdrop
   * clicks apart from clicks on slotted content. Registered as a *capture*
   * listener (see `render()`) so this geometry read happens before any
   * bubble-phase click handler on the slotted content itself - a control
   * inside the sheet (e.g. a mode toggle) that changes what's rendered can
   * shrink/reposition the dialog synchronously as its own bubble-phase
   * handler runs, and reading the rect afterward would compare the click's
   * original coordinates against the sheet's already-changed box, closing
   * the sheet on what was actually a click on its own content.
   */
  private _onDialogClick = (event: MouseEvent): void => {
    const rect = this._dialog.getBoundingClientRect();
    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!clickedInside) this._dispatchScrimClick();
  };

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (this.open) {
      this._closing = false;
      if (!this._dialog.open) this._dialog.showModal();
    } else if (this._dialog.open && !this._closing) {
      this._beginClosing();
    }
  }

  /** Plays the exit transition (via the `closing` class) to completion, then performs the real `close()`. See `_closing`'s doc comment for why. */
  private async _beginClosing(): Promise<void> {
    this._closing = true;
    await this.updateComplete;

    const animations = this._dialog.getAnimations ? this._dialog.getAnimations() : [];
    if (animations.length > 0) {
      try {
        await Promise.all(animations.map((animation) => animation.finished));
      } catch {
        // A running animation was canceled - e.g. `open` flipped back to
        // true mid-close. Nothing to do; the check below leaves the dialog
        // open in that case.
      }
    }

    this._closing = false;
    if (!this.open && this._dialog.open) this._dialog.close();
  }

  render(): HTMLTemplateResult {
    return html`
      <dialog
        class="sheet ${this._closing ? "closing" : ""}"
        aria-label="${this.label}"
        @cancel="${this._onCancel}"
        @close="${this._onClose}"
        @click="${{ handleEvent: this._onDialogClick, capture: true }}"
      >
        <slot></slot>
      </dialog>
    `;
  }
}
