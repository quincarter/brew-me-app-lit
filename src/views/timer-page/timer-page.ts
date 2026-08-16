import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/connection-status-pill/brew-connection-status-pill";
import "../../components/device-connect-action/brew-device-connect-action";
import "../../components/saved-brew-picker-sheet/brew-saved-brew-picker-sheet";
import "../../components/stat-tile/brew-stat-tile";
import "../../components/timer-controls/brew-timer-controls";
import "../../components/timer-dial/brew-timer-dial";
import "../../components/timer-recipe-panel/brew-timer-recipe-panel";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import {
  connectMonitor,
  connectScale,
  disconnectMonitor,
  disconnectScale,
  monitorConnectionStateSignal,
  scaleConnectionStateSignal,
} from "../../shared/stores/device-connection.store";
import {
  type GuidedTimerMode,
  clearPrimedRecipe,
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
import {
  latestMonitorReadingSignal,
  latestScaleReadingSignal,
} from "../../shared/stores/telemetry.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
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

  private _renderDevicesRow(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    return html`
      <div class="devices-row">
        <div class="device">
          <span class="device-name">Bookoo Scale</span>
          <brew-connection-status-pill
            state="${scaleConnectionStateSignal.value}"
          ></brew-connection-status-pill>
          <brew-device-connect-action
            state="${scaleConnectionStateSignal.value}"
            @connect-click="${connectScale}"
            @disconnect-click="${disconnectScale}"
          ></brew-device-connect-action>
        </div>
        <div class="device">
          <span class="device-name">Espresso Monitor</span>
          <brew-connection-status-pill
            state="${monitorConnectionStateSignal.value}"
          ></brew-connection-status-pill>
          <brew-device-connect-action
            state="${monitorConnectionStateSignal.value}"
            @connect-click="${connectMonitor}"
            @disconnect-click="${disconnectMonitor}"
          ></brew-device-connect-action>
        </div>
      </div>
    `;
  }

  private _renderTelemetryRow(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    const weight = latestScaleReadingSignal.value?.weightGrams.toFixed(1) ?? "--";
    const pressure = latestMonitorReadingSignal.value?.pressureBar.toFixed(1) ?? "--";

    return html`
      <div class="telemetry-row">
        <brew-stat-tile value="${weight}" label="Weight (g)"></brew-stat-tile>
        <brew-stat-tile value="${pressure}" label="Pressure (bar)"></brew-stat-tile>
      </div>
    `;
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
        <brew-top-bar title="${title}" .icon="${ARROW_BACK_ICON_SVG}" href="/more"></brew-top-bar>

        <div class="content">
          ${this._renderDevicesRow()}

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
          ${this._renderTelemetryRow()}

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
