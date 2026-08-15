import { type HTMLTemplateResult, html, LitElement, type PropertyValues } from "lit";
import { property, query, state } from "lit/decorators.js";
import { BottomSheetStyles } from "./bottom-sheet.styles";

/** Hard cap on how long `_beginClosing` will wait for the exit transition before closing anyway - comfortably above the longest transition duration in `bottom-sheet.styles.ts` (0.28s), as a safety net against a stuck/never-settling animation. */
const MAX_CLOSE_WAIT_MS = 1000;
/** Poll interval for `_waitForExitTransition`. `setTimeout`, not `requestAnimationFrame` - rAF can be suspended for a backgrounded/inactive tab, which would otherwise stall a close indefinitely. */
const CLOSE_POLL_INTERVAL_MS = 30;

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
  /** Bumped on disconnect so a `_waitForExitTransition` poll loop outliving the element (e.g. the consumer unmounts mid-close via router navigation) notices and stops instead of touching a detached `_dialog` once it resolves - same pattern as `TourOverlay.ts`'s `_activationToken`. */
  private _closeToken = 0;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._closeToken += 1;
  }

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
    const token = this._closeToken;
    this._closing = true;
    await this.updateComplete;
    await this._waitForExitTransition();
    if (token !== this._closeToken) return; // Disconnected mid-close - _dialog may be detached.

    this._closing = false;
    if (!this.open && this._dialog.open) this._dialog.close();
  }

  /**
   * Waits for the dialog's exit-transition animations to stop running,
   * polling `getAnimations()` on a plain timer rather than awaiting each
   * `Animation.finished` promise - in practice those promises don't
   * reliably settle for CSS-transition-backed animations on a top-layer
   * `<dialog>` in every engine. A hard cap keeps a close from ever blocking
   * indefinitely if a transition's state doesn't resolve for some other
   * unforeseen reason.
   */
  private _waitForExitTransition(): Promise<void> {
    if (!this._dialog.getAnimations) return Promise.resolve();

    const stillRunning = (): boolean =>
      this._dialog
        .getAnimations()
        .some((animation) => animation.playState === "running" || animation.pending);

    if (!stillRunning()) return Promise.resolve();

    return new Promise((resolve) => {
      const deadline = performance.now() + MAX_CLOSE_WAIT_MS;
      const token = this._closeToken;
      const check = (): void => {
        if (token !== this._closeToken || !stillRunning() || performance.now() >= deadline) {
          resolve();
          return;
        }
        setTimeout(check, CLOSE_POLL_INTERVAL_MS);
      };
      setTimeout(check, CLOSE_POLL_INTERVAL_MS);
    });
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
