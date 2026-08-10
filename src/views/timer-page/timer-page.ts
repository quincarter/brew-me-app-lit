import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/chip/brew-chip";
import "../../components/icon-button/brew-icon-button";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import { PAUSE_ICON, PLAY_ICON, REFRESH_ICON } from "../../shared/icons/icons";
import {
  type GuidedTimerMode,
  guidedModeSignal,
  primedRecipeSignal,
  resetTimer,
  setGuidedMode,
  setGuidedTargetSeconds,
  timerRunningSignal,
  timerSecondsSignal,
  toggleTimer,
} from "../../shared/stores/timer.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import { formatSeconds } from "../../shared/utilities/format-time.utility";
import { TimerPageStyles } from "./timer-page.styles";

@customElement("timer-page")
export class TimerPage extends SignalWatcher(LitElement) {
  static styles = [TimerPageStyles, responsiveScreenStyles];

  private _onTargetMinutesChange(value: string): void {
    const minutes = Number.parseFloat(value);
    if (Number.isNaN(minutes) || minutes < 0) return;
    setGuidedTargetSeconds(minutes * 60);
  }

  render(): HTMLTemplateResult {
    const running = timerRunningSignal.value;
    const recipe = primedRecipeSignal.value;
    const mode: GuidedTimerMode = guidedModeSignal.value;
    const targetSeconds = recipe?.targetSeconds ?? null;
    const isCountdown = recipe !== null && mode === "countdown" && targetSeconds !== null;
    const dialSeconds = isCountdown
      ? Math.max(0, (targetSeconds as number) - timerSecondsSignal.value)
      : timerSecondsSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Pour-over Timer" icon="arrow_back" href="/more"></brew-top-bar>

        <div class="content">
          <div class="dial ${recipe ? "guided" : ""}">
            ${
              isCountdown
                ? html`
                    <div class="dial-value">${formatSeconds(dialSeconds)}</div>
                    <div class="dial-label">total brew time</div>
                  `
                : html`
                    <div class="dial-label">Brewing</div>
                    <div class="dial-value">${formatSeconds(dialSeconds)}</div>
                  `
            }
          </div>

          ${
            recipe
              ? html`
                  <div class="recipe-caption">
                    <p class="recipe-caption-name">${recipe.name} · ${formatRatio(recipe.ratio)}</p>
                    <p class="recipe-caption-detail">
                      ${recipe.coffee}g coffee · ${recipe.water}g water
                    </p>
                  </div>

                  <div class="guided-options">
                    <div class="mode-toggle">
                      <brew-chip
                        label="Count down"
                        ?selected="${mode === "countdown"}"
                        @chip-click="${() => setGuidedMode("countdown")}"
                      ></brew-chip>
                      <brew-chip
                        label="Count up"
                        ?selected="${mode === "countup"}"
                        @chip-click="${() => setGuidedMode("countup")}"
                      ></brew-chip>
                    </div>
                    ${
                      mode === "countdown"
                        ? html`
                            <brew-text-field
                              label="Target (minutes)"
                              type="number"
                              .value="${String(
                                Math.round(((targetSeconds ?? 0) / 60) * 100) / 100,
                              )}"
                              @value-change="${(e: CustomEvent<string>) =>
                                this._onTargetMinutesChange(e.detail)}"
                            ></brew-text-field>
                          `
                        : nothing
                    }
                  </div>
                `
              : null
          }

          <div class="controls">
            <brew-icon-button
              .svgIcon="${REFRESH_ICON}"
              aria-label="Reset"
              @icon-click="${resetTimer}"
            ></brew-icon-button>
            <brew-icon-button
              .svgIcon="${running ? PAUSE_ICON : PLAY_ICON}"
              variant="fab"
              size="28"
              aria-label="${running ? "Pause" : "Start"}"
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
