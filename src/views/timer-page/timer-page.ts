import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/active-step-banner/brew-active-step-banner";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/collapsible-banner/brew-collapsible-banner";
import "../../components/device-connect-action/brew-device-connect-action";
import "../../components/extraction-chart/brew-extraction-chart";
import "../../components/icon-button/brew-icon-button";
import "../../components/saved-brew-picker-sheet/brew-saved-brew-picker-sheet";
import "../../components/stat-tile/brew-stat-tile";
import "../../components/timer-controls/brew-timer-controls";
import "../../components/timer-dial/brew-timer-dial";
import "../../components/timer-recipe-panel/brew-timer-recipe-panel";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG, CLOSE_ICON } from "../../shared/icons/icons";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import { savedBrewsSignal } from "../../shared/stores/brew.store";
import {
  connectMonitor,
  connectScale,
  devicesBannerDismissedSignal,
  disconnectMonitor,
  disconnectScale,
  dismissDevicesBanner,
  monitorConnectionStateSignal,
  neverShowDevicesBannerAgain,
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
  stopSession,
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

/** How long the "go to Settings to connect devices" notice stays up after "Never show again". */
const SETTINGS_NOTICE_DURATION_MS = 5000;

@customElement("timer-page")
export class TimerPage extends SignalWatcher(LitElement) {
  static styles = [TimerPageStyles, responsiveScreenStyles];

  @state() private _pickerOpen = false;
  @state() private _showSettingsNotice = false;

  private _settingsNoticeTimeout: ReturnType<typeof setTimeout> | undefined;

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._settingsNoticeTimeout);
  }

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

  private _onNeverShowBanner = (): void => {
    neverShowDevicesBannerAgain();
    this._showSettingsNotice = true;
    clearTimeout(this._settingsNoticeTimeout);
    this._settingsNoticeTimeout = setTimeout(() => {
      this._showSettingsNotice = false;
    }, SETTINGS_NOTICE_DURATION_MS);
  };

  private _dismissSettingsNotice = (): void => {
    clearTimeout(this._settingsNoticeTimeout);
    this._showSettingsNotice = false;
  };

  /**
   * A compact, dismissible offer to pair whichever devices aren't connected yet - a device
   * already connected shows its icon in the top bar instead (every screen's `brew-top-bar`
   * now owns this globally) rather than staying listed here, and once both are connected
   * there's nothing left to offer so the banner disappears on its own. Devices are optional,
   * so someone who doesn't own either can dismiss this for the rest of the session instead of
   * it permanently pushing the dial/controls down.
   */
  private _renderDevicesBanner(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    const scaleState = scaleConnectionStateSignal.value;
    const monitorState = monitorConnectionStateSignal.value;
    const bothConnected = scaleState === "connected" && monitorState === "connected";
    // Rendered (via `brew-collapsible-banner`'s `open`) rather than removed outright even
    // while closed, so dismissing it - or both devices finishing connecting - plays the exit
    // animation instead of the banner just vanishing mid-render.
    const bannerOpen = !devicesBannerDismissedSignal.value && !bothConnected;

    return html`
      <brew-collapsible-banner ?open="${bannerOpen}">
        <div class="devices-banner">
          <div class="devices-banner-header">
            <span class="devices-banner-title">Connect your devices</span>
            <brew-icon-button
              .svgIcon="${CLOSE_ICON}"
              size="14"
              style="--icon-button-size: 24px"
              aria-label="Dismiss"
              @icon-click="${dismissDevicesBanner}"
            ></brew-icon-button>
          </div>
          ${
            scaleState !== "connected"
              ? html`
                  <div class="devices-banner-row">
                    <span class="devices-banner-row-label">Bookoo Scale</span>
                    <brew-device-connect-action
                      state="${scaleState}"
                      @connect-click="${connectScale}"
                      @disconnect-click="${disconnectScale}"
                    ></brew-device-connect-action>
                  </div>
                `
              : nothing
          }
          ${
            monitorState !== "connected"
              ? html`
                  <div class="devices-banner-row">
                    <span class="devices-banner-row-label">Espresso Monitor</span>
                    <brew-device-connect-action
                      state="${monitorState}"
                      @connect-click="${connectMonitor}"
                      @disconnect-click="${disconnectMonitor}"
                    ></brew-device-connect-action>
                  </div>
                `
              : nothing
          }
          <div class="devices-banner-footer">
            <brew-button variant="text" @button-click="${this._onNeverShowBanner}"
              >Never show again</brew-button
            >
          </div>
        </div>
      </brew-collapsible-banner>
    `;
  }

  /** Brief, dismissable pointer to Settings once someone picks "Never show again" above - the banner's connect affordance is gone, so this is the one-time hint for where it moved. */
  private _renderSettingsNotice(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    return html`
      <brew-collapsible-banner ?open="${this._showSettingsNotice}">
        <div class="devices-banner">
          <div class="devices-banner-header">
            <span class="devices-banner-title">To access connected devices, go to Settings</span>
            <brew-icon-button
              .svgIcon="${CLOSE_ICON}"
              size="14"
              style="--icon-button-size: 24px"
              aria-label="Dismiss"
              @icon-click="${this._dismissSettingsNotice}"
            ></brew-icon-button>
          </div>
          <brew-button variant="text" href="/more/settings">Go to Settings</brew-button>
        </div>
      </brew-collapsible-banner>
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

  /**
   * Gated on Web Bluetooth support only - `brew-extraction-chart` picks its own empty state
   * from there (an invitation to connect a device, then "Waiting for data…" once one has, per
   * `anyDeviceConnectedThisSessionSignal`), so a supported browser always sees this card even
   * before ever connecting anything, rather than the chart's whole spot being absent.
   */
  private _renderExtractionChart(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    return html`<brew-extraction-chart></brew-extraction-chart>`;
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
    // Reflects the guided timer's own progress, not device-connection state - shown whether or not a scale/monitor is connected.
    const guidedSteps = recipe?.steps ?? null;
    const showActiveStepBanner = guidedSteps !== null && guidedSteps.length > 0 && running;

    return html`
      <div class="screen">
        <brew-top-bar title="${title}" .icon="${ARROW_BACK_ICON_SVG}" href="/more"></brew-top-bar>

        <div class="content">
          ${
            showActiveStepBanner
              ? html`<brew-active-step-banner
                  .steps="${guidedSteps}"
                  elapsed-seconds="${timerSecondsSignal.value}"
                ></brew-active-step-banner>`
              : nothing
          }
          ${this._renderDevicesBanner()} ${this._renderSettingsNotice()}

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
          ${this._renderTelemetryRow()} ${this._renderExtractionChart()}

          <brew-timer-controls
            ?idle="${isIdle}"
            ?running="${running}"
            ?has-saved-brews="${hasSavedBrews}"
            ?has-recipe="${recipe !== null}"
            ?device-connected="${
              scaleConnectionStateSignal.value === "connected" ||
              monitorConnectionStateSignal.value === "connected"
            }"
            @start-click="${toggleTimer}"
            @choose-saved-click="${this._openPicker}"
            @reset-click="${resetTimer}"
            @toggle-click="${toggleTimer}"
            @clear-click="${clearPrimedRecipe}"
            @seal-click="${stopSession}"
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
