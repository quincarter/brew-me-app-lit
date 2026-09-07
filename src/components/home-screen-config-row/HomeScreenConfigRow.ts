import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon-button/brew-icon-button";
import "../switch/brew-switch";
import { DRAG_INDICATOR_ICON_SVG } from "../../shared/icons/icons";
import { HomeScreenConfigRowStyles } from "./home-screen-config-row.styles";

/**
 * # Home Screen Config Row
 * One card's row on the Home Screen Configurator screen - title,
 * description, a visibility switch, and a drag handle for reordering
 * (pointer-drag or `ArrowUp`/`ArrowDown` while it's focused). Purely
 * presentational/controlled (like `brew-cloud-sync-provider-row`): it owns
 * no ordering or visibility state itself, just reports gestures/taps via
 * events for the page to apply through `home-screen-config.store`. The
 * drag handle itself only *reports* pointer positions - the consuming page
 * owns the actual "which row is this now over" and live-reorder-preview
 * logic, the same split `brew-steps-card` uses for its own row reordering.
 * ## Usage
 * ```html
 * <brew-home-screen-config-row
 *   title="Stats"
 *   description="Saved brew count and day streak"
 *   ?visible="${true}"
 *   ?dragging="${false}"
 *   @visibility-change="${(e) => setHomeScreenSectionVisible('stats', e.detail)}"
 *   @reorder-pointerdown="${(e) => this._onReorderStart('stats', e)}"
 *   @reorder-pointermove="${(e) => this._onReorderMove('stats', e)}"
 *   @reorder-pointerend="${() => this._onReorderEnd()}"
 *   @move-up-click="${() => moveHomeScreenSection('stats', 'up')}"
 *   @move-down-click="${() => moveHomeScreenSection('stats', 'down')}"
 * ></brew-home-screen-config-row>
 * ```
 * @element brew-home-screen-config-row
 * @fires visibility-change - `CustomEvent<boolean>` fired with the new checked state when the visibility switch is toggled.
 * @fires reorder-pointerdown - `CustomEvent<PointerEvent>` fired when the drag handle receives a pointerdown - the consumer should capture the pointer itself if it wants to keep tracking it.
 * @fires reorder-pointermove - `CustomEvent<{clientX: number; clientY: number}>` fired on every pointermove while dragging.
 * @fires reorder-pointerend - Fired on pointerup/pointercancel, ending the drag.
 * @fires move-up-click - Fired when `ArrowUp` is pressed while the drag handle is focused - the keyboard equivalent of dragging one step up.
 * @fires move-down-click - Fired when `ArrowDown` is pressed while the drag handle is focused - the keyboard equivalent of dragging one step down.
 */
export class HomeScreenConfigRow extends LitElement {
  static styles = [HomeScreenConfigRowStyles];

  @property({ type: String }) title = "";
  @property({ type: String }) description = "";
  /**
   * Defaults to `false`, not `true` - `?visible="${entry.visible}"` (a
   * boolean-attribute binding) only ever *adds* the `visible` attribute for
   * a truthy value; it never writes `visible="false"`. On a freshly created
   * element (e.g. remounting this page after navigating away) where the
   * bound value is `false`, the attribute is simply never set, so whatever
   * this field defaults to is what the property silently keeps. Defaulting
   * to `true` here made every freshly-created row for an already-hidden
   * section look visible again despite the store correctly having it
   * hidden - matching `brew-switch`'s `checked = false` default avoids it.
   */
  @property({ type: Boolean, reflect: true }) visible = false;
  /** Set by the page while this row is the one being pointer-dragged - applies the lifted/dimmed drag-feedback treatment (same visual language as `brew-steps-card`'s `.dragging`). */
  @property({ type: Boolean, reflect: true }) dragging = false;

  private _onVisibleChange = (event: CustomEvent<boolean>): void => {
    this.dispatchEvent(
      new CustomEvent<boolean>("visibility-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _onDragHandlePointerDown = (event: PointerEvent): void => {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dispatchEvent(
      new CustomEvent<PointerEvent>("reorder-pointerdown", {
        detail: event,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _onDragHandlePointerMove = (event: PointerEvent): void => {
    this.dispatchEvent(
      new CustomEvent("reorder-pointermove", {
        detail: { clientX: event.clientX, clientY: event.clientY },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _onDragHandlePointerEnd = (): void => {
    this.dispatchEvent(new CustomEvent("reorder-pointerend", { bubbles: true, composed: true }));
  };

  private _onDragHandleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent(event.key === "ArrowUp" ? "move-up-click" : "move-down-click", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  render(): HTMLTemplateResult {
    return html`
      <div class="row ${this.dragging ? "dragging" : ""}">
        <brew-icon-button
          class="drag-handle"
          .svgIcon="${DRAG_INDICATOR_ICON_SVG}"
          size="20"
          aria-label="Reorder ${this.title || "section"} - use arrow keys or drag"
          @pointerdown="${this._onDragHandlePointerDown}"
          @pointermove="${this._onDragHandlePointerMove}"
          @pointerup="${this._onDragHandlePointerEnd}"
          @pointercancel="${this._onDragHandlePointerEnd}"
          @keydown="${this._onDragHandleKeydown}"
        ></brew-icon-button>
        <div class="row-text">
          <span class="headline">${this.title}</span>
          ${this.description ? html`<span class="supporting">${this.description}</span>` : null}
        </div>
        <brew-switch
          ?checked="${this.visible}"
          aria-label="Show ${this.title}"
          @change="${this._onVisibleChange}"
        ></brew-switch>
      </div>
    `;
  }
}
