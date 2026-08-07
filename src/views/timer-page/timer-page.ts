import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/icon-button/brew-icon-button";
import "../../components/top-bar/brew-top-bar";
import {
  resetTimer,
  timerRunningSignal,
  timerSecondsSignal,
  toggleTimer,
} from "../../shared/stores/timer.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { TimerPageStyles } from "./timer-page.styles";

@customElement("timer-page")
export class TimerPage extends SignalWatcher(LitElement) {
  static styles = [TimerPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    const running = timerRunningSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Pour-over Timer" icon="arrow_back" href="/more"></brew-top-bar>

        <div class="content">
          <div class="dial">
            <div class="dial-label">Brewing</div>
            <div class="dial-value">${formatSeconds(timerSecondsSignal.value)}</div>
          </div>

          <div class="controls">
            <brew-icon-button
              icon="refresh"
              aria-label="Reset"
              @icon-click="${resetTimer}"
            ></brew-icon-button>
            <brew-icon-button
              icon="${running ? "pause" : "play_arrow"}"
              variant="fab"
              size="32"
              aria-label="Play or pause"
              @icon-click="${toggleTimer}"
            ></brew-icon-button>
            <span class="spacer"></span>
          </div>

          <p class="hint">
            ${running ? "Brewing in progress…" : "Tap play to start your pour-over timer."}
          </p>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
