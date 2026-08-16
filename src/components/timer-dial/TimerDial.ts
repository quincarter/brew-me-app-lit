import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { TimerDialStyles } from "./timer-dial.styles";

/**
 * # Timer Dial
 * The Timer screen's circular time readout - a bordered ring with a
 * "Ready"/"Brewing" label above the elapsed value, the same look whether
 * it's a plain stopwatch or a guided/recipe-primed brew. `countdown`
 * additionally swaps the label to "total brew time" under the value, for a
 * guided brew that's counting down to its target rather than counting up
 * from zero.
 * @element brew-timer-dial
 */
export class TimerDial extends LitElement {
  static styles = [TimerDialStyles];

  @property({ type: Boolean }) countdown = false;
  @property({ type: Boolean }) idle = false;
  @property({ type: Number }) seconds = 0;

  render(): HTMLTemplateResult {
    return html`
      <div class="dial">
        ${
          this.countdown
            ? html`
                <div class="dial-value">${formatSeconds(this.seconds)}</div>
                <div class="dial-label">total brew time</div>
              `
            : html`
                <div class="dial-label">${this.idle ? "Ready" : "Brewing"}</div>
                <div class="dial-value">${formatSeconds(this.seconds)}</div>
              `
        }
      </div>
    `;
  }
}
