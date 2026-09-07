import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, type PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/home-screen-config-row/brew-home-screen-config-row";
import "../../components/top-bar/brew-top-bar";
import type {
  HomeScreenSectionId,
  IHomeScreenSectionConfig,
} from "../../shared/interfaces/home-screen-config.interface";
import {
  getAvailableHomeScreenConfig,
  HOME_SCREEN_SECTION_LABELS,
  moveHomeScreenSection,
  reorderHomeScreenSections,
  resetHomeScreenConfig,
  setHomeScreenSectionVisible,
} from "../../shared/stores/home-screen-config.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import {
  composedClosest,
  deepElementFromPoint,
} from "../../shared/utilities/deep-shadow-dom.utility";
import { moveItem } from "../../shared/utilities/reorder.utility";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { HomeScreenConfiguratorPageStyles } from "./home-screen-configurator-page.styles";

const REORDER_ANIMATION_DURATION_MS = 200;

/**
 * Home Screen Configurator screen (`/more/settings/home-screen`) - reorder
 * and show/hide Home's cards. Reached from Settings, which keeps its own
 * bottom nav visible - this screen does too (with `more` still highlighted)
 * so drilling in doesn't lose the tab bar, same convention as Cloud Sync's
 * own settings detail screen.
 *
 * Only ever renders rows for sections `isHomeScreenSectionAvailable`
 * (via `getAvailableHomeScreenConfig`) - a section gated by a
 * progressive-enhancement check (Bluetooth-only `devices`, build-gated
 * `cloudSync`) never appears as a toggle at all on a browser/build that
 * can't show it, rather than offering a switch that can't do anything.
 *
 * Reordering itself follows the same split `brew-steps-card` uses for its
 * own drag-to-reorder rows: each `brew-home-screen-config-row`'s drag
 * handle only *reports* pointer positions via `reorder-pointerdown`/
 * `reorder-pointermove`/`reorder-pointerend`; this page owns the actual
 * "which row is the pointer over now" resolution (`_rowIdAtPoint`, piercing
 * shadow DOM the same way `brew-steps-card` does) and the live
 * `_previewOrder` state driving what's displayed mid-drag - only committed
 * to the store (`reorderHomeScreenSections`) once the drag ends. Every
 * row's position is measured before and after each update
 * (`willUpdate`/`updated`) and animated between the two with a FLIP
 * transform, so rows visibly slide into their new slots - both during a
 * live drag and for a single arrow-key move.
 */
@customElement("home-screen-configurator-page")
export class HomeScreenConfiguratorPage extends SignalWatcher(LitElement) {
  static styles = [HomeScreenConfiguratorPageStyles, responsiveScreenStyles];

  /** Id of the row currently being pointer-dragged, or `null` when no drag is in progress. */
  @state() private _draggingId: HomeScreenSectionId | null = null;
  /** Live-reordered ids shown while a drag is in progress; `null` outside of a drag, in which case `getAvailableHomeScreenConfig()` renders as-is. */
  @state() private _previewOrder: HomeScreenSectionId[] | null = null;

  private _rowRectsBeforeUpdate = new Map<HomeScreenSectionId, DOMRect>();

  private _onVisibilityChange(id: HomeScreenSectionId, event: CustomEvent<boolean>): void {
    setHomeScreenSectionVisible(id, event.detail);
  }

  /** Rows currently displayed: the live drag preview while dragging, otherwise the store's own order. Shared by `render()` and the drag handlers so both agree on what's on screen. */
  private _displayConfig(): IHomeScreenSectionConfig[] {
    const available = getAvailableHomeScreenConfig();
    if (!this._previewOrder) return available;

    const byId = new Map(available.map((entry) => [entry.id, entry]));
    return this._previewOrder
      .map((id) => byId.get(id))
      .filter((entry): entry is IHomeScreenSectionConfig => Boolean(entry));
  }

  /** Which row's `data-section-id` sits under a viewport point, or `null` if none does - mirrors `brew-steps-card`'s own `_rowIdAtPoint`, since this page sits just as many shadow roots deep (app-shell -> home-screen-configurator-page -> brew-home-screen-config-row -> brew-icon-button). */
  private _rowIdAtPoint(x: number, y: number): HomeScreenSectionId | null {
    const target = deepElementFromPoint(x, y);
    const row = composedClosest(target, "[data-section-id]");
    return (row?.dataset.sectionId as HomeScreenSectionId | undefined) ?? null;
  }

  private _onReorderStart = (id: HomeScreenSectionId): void => {
    this._draggingId = id;
    this._previewOrder = this._displayConfig().map((entry) => entry.id);
  };

  private _onReorderMove = (event: CustomEvent<{ clientX: number; clientY: number }>): void => {
    if (!this._draggingId || !this._previewOrder) return;

    const overId = this._rowIdAtPoint(event.detail.clientX, event.detail.clientY);
    if (!overId || overId === this._draggingId) return;

    const fromIndex = this._previewOrder.indexOf(this._draggingId);
    const toIndex = this._previewOrder.indexOf(overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    this._previewOrder = moveItem(this._previewOrder, fromIndex, toIndex);
  };

  /** Ends a drag (drop or cancel): commits the reorder like any other edit if the order actually changed, then clears drag state. */
  private _onReorderEnd = (): void => {
    if (this._previewOrder) {
      const originalOrder = getAvailableHomeScreenConfig()
        .map((entry) => entry.id)
        .join("|");
      const previewOrder = this._previewOrder.join("|");
      if (originalOrder !== previewOrder) reorderHomeScreenSections(this._previewOrder);
    }
    this._draggingId = null;
    this._previewOrder = null;
  };

  private _measureRows(): Map<HomeScreenSectionId, DOMRect> {
    const rects = new Map<HomeScreenSectionId, DOMRect>();
    this.shadowRoot?.querySelectorAll<HTMLElement>("[data-section-id]").forEach((row) => {
      const id = row.dataset.sectionId as HomeScreenSectionId | undefined;
      if (id) rects.set(id, row.getBoundingClientRect());
    });
    return rects;
  }

  protected willUpdate(_changed: PropertyValues<this>): void {
    this._rowRectsBeforeUpdate = this._measureRows();
  }

  /**
   * FLIP ("First, Last, Invert, Play"): each row was already positioned by
   * the browser's normal layout for the *new* order by the time this runs -
   * for any row whose position actually shifted since `willUpdate` measured
   * it, animate a transform from its old offset back to zero so it visibly
   * slides into place instead of snapping. The row currently being dragged
   * is excluded - it's already tracking the pointer via its own drag
   * feedback, so flipping it too would fight that instead of complementing
   * it.
   *
   * While a row's slide animation is in flight, it's given
   * `pointer-events: none` (restored once nothing's animating on it
   * anymore) - a CSS transform mid-animation moves an element's *visual*
   * position, which `elementFromPoint` hit-tests against, but `_rowIdAtPoint`
   * only ever cares where a row's slot has *settled*. Without this, dragging
   * a row up exactly one slot (e.g. the 2nd row to the top) would resolve
   * `overId` to the row it just swapped past a second time while that row
   * was still mid-slide back into view, computing the swap in reverse and
   * silently undoing the very move that was just made - repeatedly, for as
   * long as the pointer lingered near that boundary.
   */
  protected updated(_changed: PropertyValues<this>): void {
    const rowsAfter = this.shadowRoot?.querySelectorAll<HTMLElement>("[data-section-id]") ?? [];
    rowsAfter.forEach((row) => {
      const id = row.dataset.sectionId as HomeScreenSectionId | undefined;
      if (!id || id === this._draggingId || typeof row.animate !== "function") return;

      const before = this._rowRectsBeforeUpdate.get(id);
      if (!before) return;

      const after = row.getBoundingClientRect();
      const deltaY = before.top - after.top;
      if (Math.abs(deltaY) < 1) return;

      const animation = row.animate(
        [{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }],
        { duration: REORDER_ANIMATION_DURATION_MS, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      row.style.pointerEvents = "none";
      const restoreIfIdle = (): void => {
        if ((row.getAnimations?.() ?? []).length === 0) row.style.pointerEvents = "";
      };
      animation.finished.then(restoreIfIdle).catch(restoreIfIdle);
    });
  }

  render(): HTMLTemplateResult {
    const config = this._displayConfig();

    return html`
      <div class="screen">
        <brew-top-bar
          title="Home Screen"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
          <p class="section-hint">
            Choose which cards show up on Home. Drag a row's handle (or focus it and use the arrow
            keys) to reorder - hidden cards keep their settings, so toggling one back on any time
            restores it right where you left it.
          </p>

          <div class="rows">
            ${repeat(
              config,
              (entry) => entry.id,
              (entry, index) => html`
                ${index > 0 ? html`<div class="divider"></div>` : null}
                <brew-home-screen-config-row
                  data-section-id="${entry.id}"
                  title="${HOME_SCREEN_SECTION_LABELS[entry.id].title}"
                  description="${HOME_SCREEN_SECTION_LABELS[entry.id].description}"
                  ?visible="${entry.visible}"
                  ?dragging="${this._draggingId === entry.id}"
                  @visibility-change="${(e: CustomEvent<boolean>) =>
                    this._onVisibilityChange(entry.id, e)}"
                  @reorder-pointerdown="${() => this._onReorderStart(entry.id)}"
                  @reorder-pointermove="${this._onReorderMove}"
                  @reorder-pointerend="${this._onReorderEnd}"
                  @move-up-click="${() => moveHomeScreenSection(entry.id, "up")}"
                  @move-down-click="${() => moveHomeScreenSection(entry.id, "down")}"
                ></brew-home-screen-config-row>
              `,
            )}
          </div>

          <brew-button variant="outlined" @button-click="${resetHomeScreenConfig}"
            >Reset to default</brew-button
          >
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
