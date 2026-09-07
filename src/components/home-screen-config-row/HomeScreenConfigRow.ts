import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import "../switch/brew-switch";
import { EXPAND_LESS_ICON_SVG, EXPAND_MORE_ICON_SVG } from "../../shared/icons/icons";
import { HomeScreenConfigRowStyles } from "./home-screen-config-row.styles";

/**
 * # Home Screen Config Row
 * One card's row on the Home Screen Configurator screen - title,
 * description, a visibility switch, and up/down reorder buttons. Purely
 * presentational/controlled (like `brew-cloud-sync-provider-row`): it owns
 * no ordering or visibility state itself, just reports taps via events for
 * the page to apply through `home-screen-config.store`.
 *
 * Uses plain `<button>`s (not `brew-icon-button`) for the reorder controls
 * because `brew-icon-button` has no `disabled` support - boundary rows
 * (first/last in the list) need a genuinely disabled, non-focusable move
 * button rather than one that's merely styled to look inactive.
 * ## Usage
 * ```html
 * <brew-home-screen-config-row
 *   title="Stats"
 *   description="Saved brew count and day streak"
 *   ?visible="${true}"
 *   ?disable-move-up="${false}"
 *   ?disable-move-down="${false}"
 *   @visibility-change="${(e) => setHomeScreenSectionVisible('stats', e.detail)}"
 *   @move-up-click="${() => moveHomeScreenSection('stats', 'up')}"
 *   @move-down-click="${() => moveHomeScreenSection('stats', 'down')}"
 * ></brew-home-screen-config-row>
 * ```
 * @element brew-home-screen-config-row
 * @fires visibility-change - `CustomEvent<boolean>` fired with the new checked state when the visibility switch is toggled.
 * @fires move-up-click - Fired when the (non-disabled) move-up button is activated.
 * @fires move-down-click - Fired when the (non-disabled) move-down button is activated.
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
  @property({ type: Boolean, attribute: "disable-move-up" }) disableMoveUp = false;
  @property({ type: Boolean, attribute: "disable-move-down" }) disableMoveDown = false;

  private _onVisibleChange = (event: CustomEvent<boolean>): void => {
    this.dispatchEvent(
      new CustomEvent<boolean>("visibility-change", {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _onMoveUpClick = (): void => {
    if (this.disableMoveUp) return;
    this.dispatchEvent(new CustomEvent("move-up-click", { bubbles: true, composed: true }));
  };

  private _onMoveDownClick = (): void => {
    if (this.disableMoveDown) return;
    this.dispatchEvent(new CustomEvent("move-down-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    return html`
      <div class="row">
        <div class="row-text">
          <span class="headline">${this.title}</span>
          ${this.description ? html`<span class="supporting">${this.description}</span>` : null}
        </div>
        <div class="row-controls">
          <button
            class="move-btn"
            type="button"
            aria-label="Move ${this.title} up"
            ?disabled="${this.disableMoveUp}"
            @click="${this._onMoveUpClick}"
          >
            <brew-icon .svg="${EXPAND_LESS_ICON_SVG}" size="20"></brew-icon>
          </button>
          <button
            class="move-btn"
            type="button"
            aria-label="Move ${this.title} down"
            ?disabled="${this.disableMoveDown}"
            @click="${this._onMoveDownClick}"
          >
            <brew-icon .svg="${EXPAND_MORE_ICON_SVG}" size="20"></brew-icon>
          </button>
          <brew-switch
            ?checked="${this.visible}"
            aria-label="Show ${this.title}"
            @change="${this._onVisibleChange}"
          ></brew-switch>
        </div>
      </div>
    `;
  }
}
