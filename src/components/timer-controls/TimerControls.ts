import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import {
  CLOSE_ICON,
  PAUSE_ICON,
  PLAY_ICON,
  REFRESH_ICON,
  STOP_ICON,
} from "../../shared/icons/icons";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import { TimerControlsStyles } from "./timer-controls.styles";

/**
 * # Timer Controls
 * The Timer screen's action row: while `idle` (nothing primed, running, or
 * elapsed yet), a "Start timer now" button plus, when `hasSavedBrews` is
 * true, a "Choose from saved brews" button — otherwise a compact hint
 * pointing users at the calculator to save their first ratio. When not
 * `idle`, the reset/play-pause controls plus a hint line, with a
 * "Clear brew" button in place of the reset row's trailing spacer once a
 * recipe is primed (`hasRecipe`). While `running` with `deviceConnected`
 * true, the play/pause fab swaps for a Stop/Seal fab that ends and saves
 * the shot instead of just pausing.
 * @element brew-timer-controls
 * @fires start-click - Fired from the idle "Start timer now" button.
 * @fires choose-saved-click - Fired from the idle "Choose from saved brews" button.
 * @fires reset-click - Fired from the reset icon button.
 * @fires toggle-click - Fired from the play/pause icon button.
 * @fires clear-click - Fired from the "Clear brew" icon button.
 * @fires seal-click - Fired from the Stop/Seal fab (running + deviceConnected only).
 */
export class TimerControls extends LitElement {
  static styles = [TimerControlsStyles];

  @property({ type: Boolean }) idle = false;
  @property({ type: Boolean }) running = false;
  @property({ type: Boolean, attribute: "has-saved-brews" }) hasSavedBrews = false;
  @property({ type: Boolean, attribute: "has-recipe" }) hasRecipe = false;
  @property({ type: Boolean, attribute: "device-connected" }) deviceConnected = false;

  private _emit(name: string): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  private _emitStart = (): void => this._emit("start-click");
  private _emitChooseSaved = (): void => this._emit("choose-saved-click");
  private _emitReset = (): void => this._emit("reset-click");
  private _emitToggle = (): void => this._emit("toggle-click");
  private _emitClear = (): void => this._emit("clear-click");
  private _emitSeal = (): void => this._emit("seal-click");

  private _renderIdleActions(): HTMLTemplateResult {
    return html`
      <div class="idle-actions">
        <brew-button variant="filled" full-width large @button-click="${this._emitStart}">
          Start timer now
        </brew-button>
        ${
          this.hasSavedBrews
            ? html`
                <brew-button variant="outlined" full-width @button-click="${this._emitChooseSaved}"
                  >Choose from saved brews</brew-button
                >
              `
            : html`
                <p class="hint">
                  No saved brews yet — <a href="/calculate">save a ratio</a> to brew from it here.
                </p>
              `
        }
      </div>
    `;
  }

  private _renderControls(): HTMLTemplateResult {
    const sealing = this.running && this.deviceConnected;

    return html`
      <div class="controls">
        <brew-icon-button
          .svgIcon="${REFRESH_ICON}"
          aria-label="Reset"
          @icon-click="${this._emitReset}"
        ></brew-icon-button>
        ${
          sealing
            ? html`
                <brew-icon-button
                  .svgIcon="${STOP_ICON}"
                  variant="fab"
                  size="28"
                  aria-label="Stop and seal"
                  @icon-click="${this._emitSeal}"
                ></brew-icon-button>
              `
            : html`
                <brew-icon-button
                  .svgIcon="${this.running ? PAUSE_ICON : PLAY_ICON}"
                  variant="fab"
                  size="28"
                  aria-label="${this.running ? "Pause" : "Start"}"
                  @icon-click="${this._emitToggle}"
                ></brew-icon-button>
              `
        }
        ${
          this.hasRecipe
            ? html`
                <brew-icon-button
                  .svgIcon="${CLOSE_ICON}"
                  aria-label="Clear brew"
                  @icon-click="${this._emitClear}"
                ></brew-icon-button>
              `
            : html`<span class="spacer"></span>`
        }
      </div>

      <p class="hint">
        ${
          sealing
            ? "Recording · Stop/Seal ends & saves this shot."
            : this.running
              ? "Brewing in progress…"
              : "Tap play to start your pour-over timer."
        }
      </p>
    `;
  }

  render(): HTMLTemplateResult {
    return this.idle ? this._renderIdleActions() : this._renderControls();
  }
}
