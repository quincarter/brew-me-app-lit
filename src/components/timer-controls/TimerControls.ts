import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../button/brew-button";
import { TimerControlsStyles } from "./timer-controls.styles";

/**
 * # Timer Controls
 * The Timer screen's idle-state action prompt: a "Start timer now" button
 * plus, when `hasSavedBrews` is true, a "Choose from saved brews" button —
 * otherwise a compact hint pointing users at the calculator to save their
 * first ratio. Once a brew is primed or running, the play/pause/reset/clear
 * controls live directly on the timer dial itself (`timer-page.ts`'s
 * `.dial-cluster`), not in this component.
 * @element brew-timer-controls
 * @fires start-click - Fired from the "Start timer now" button.
 * @fires choose-saved-click - Fired from the "Choose from saved brews" button.
 */
export class TimerControls extends LitElement {
  static styles = [TimerControlsStyles];

  @property({ type: Boolean, attribute: "has-saved-brews" }) hasSavedBrews = false;

  private _emit(name: string): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  private _emitStart = (): void => this._emit("start-click");
  private _emitChooseSaved = (): void => this._emit("choose-saved-click");

  render(): HTMLTemplateResult {
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
}
