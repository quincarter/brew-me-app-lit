import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/saved-brew-picker-sheet/brew-saved-brew-picker-sheet";
import "../../components/timer-controls/brew-timer-controls";
import "../../components/timer-dial/brew-timer-dial";
import "../../components/timer-recipe-panel/brew-timer-recipe-panel";
import "../../components/top-bar/brew-top-bar";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import {
  clearPrimedRecipe,
  type GuidedTimerMode,
  guidedModeSignal,
  primedRecipeSignal,
  primeTimerForSavedBrew,
  resetTimer,
  setGuidedMode,
  setGuidedTargetSeconds,
  timerRunningSignal,
  timerSecondsSignal,
  toggleTimer,
} from "../../shared/stores/timer.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { TimerPageStyles } from "./timer-page.styles";

@customElement("timer-page")
export class TimerPage extends SignalWatcher(LitElement) {
  static styles = [TimerPageStyles, responsiveScreenStyles];

  @state() private _pickerOpen = false;

  private _onTargetMinutesChange(value: string): void {
    const minutes = Number.parseFloat(value);
    if (Number.isNaN(minutes) || minutes < 0) return;
    setGuidedTargetSeconds(minutes * 60);
  }

  private _openPicker = (): void => {
    this._pickerOpen = true;
  };

  private _onSavedBrewSelect(event: CustomEvent<ISavedBrew>): void {
    primeTimerForSavedBrew(event.detail);
    this._pickerOpen = false;
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
    // A defined brew guide (matched via `BREW_GUIDE`, not just any saved custom type) gets its name in the title - a plain/unmatched stopwatch keeps the generic one.
    const title = recipe?.brewType ? `${recipe.brewType} Timer` : "Pour-over Timer";
    // Never primed and never started - the base screen's "start now or pick a brew" choice. Once either happens (running, or a recipe is primed) this stays false for the rest of this stopwatch/brew.
    const isIdle = recipe === null && !running && timerSecondsSignal.value === 0;
    const hasSavedBrews = savedBrewsSignal.value.length > 0;

    return html`
      <div class="screen">
        <brew-top-bar title="${title}" icon="arrow_back" href="/more"></brew-top-bar>

        <div class="content">
          <brew-timer-dial
            ?guided="${recipe !== null}"
            ?countdown="${isCountdown}"
            ?idle="${isIdle}"
            seconds="${dialSeconds}"
          ></brew-timer-dial>

          ${
            recipe
              ? html`
                  <brew-timer-recipe-panel
                    .recipe="${recipe}"
                    mode="${mode}"
                    elapsed-seconds="${timerSecondsSignal.value}"
                    @mode-change="${(e: CustomEvent<GuidedTimerMode>) => setGuidedMode(e.detail)}"
                    @target-change="${(e: CustomEvent<string>) =>
                      this._onTargetMinutesChange(e.detail)}"
                  ></brew-timer-recipe-panel>
                `
              : nothing
          }

          <brew-timer-controls
            ?idle="${isIdle}"
            ?running="${running}"
            ?has-saved-brews="${hasSavedBrews}"
            ?has-recipe="${recipe !== null}"
            @start-click="${toggleTimer}"
            @choose-saved-click="${this._openPicker}"
            @reset-click="${resetTimer}"
            @toggle-click="${toggleTimer}"
            @clear-click="${clearPrimedRecipe}"
          ></brew-timer-controls>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
        <brew-saved-brew-picker-sheet
          ?open="${this._pickerOpen}"
          @saved-brew-select="${(e: CustomEvent<ISavedBrew>) => this._onSavedBrewSelect(e)}"
          @sheet-scrim-click="${() => {
            this._pickerOpen = false;
          }}"
        ></brew-saved-brew-picker-sheet>
      </div>
    `;
  }
}
