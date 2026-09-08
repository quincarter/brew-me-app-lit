import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, query } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/chip/brew-chip";
import "../../components/device-connect-rows/brew-device-connect-rows";
import "../../components/support-card/brew-support-card";
import "../../components/switch/brew-switch";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import {
  scrollToTimerSettingsSectionSignal,
  setShowActiveStepBanner,
  setTimerCountStyle,
  showActiveStepBannerSignal,
  timerCountStyleSignal,
} from "../../shared/stores/timer-settings.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { refreshApp } from "../../shared/utilities/register-service-worker.utility";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
import { GeneralSettingsPageStyles } from "./general-settings-page.styles";

/**
 * General Settings screen (`/more/settings/general`) - the Timer defaults,
 * connected devices, app refresh, and support sections that didn't belong
 * under Brew Type Settings, Display, or Data, split out of the old
 * monolithic Settings screen so that screen could become a category hub.
 * Reached from Settings, which keeps its own bottom nav visible - this
 * screen does too (with `more` still highlighted), same convention as Home
 * Screen Configurator and Cloud Sync's own settings detail screens.
 */
@customElement("general-settings-page")
export class GeneralSettingsPage extends SignalWatcher(LitElement) {
  static styles = [GeneralSettingsPageStyles, responsiveScreenStyles];

  @query("#timer-settings-section") private _timerSectionEl?: HTMLElement;

  /** Consumes a pending scroll-to-Timer-section request from the Timer screen's settings shortcut - see `scrollToTimerSettingsSectionSignal`'s doc comment. */
  protected firstUpdated(): void {
    if (!scrollToTimerSettingsSectionSignal.value) return;
    scrollToTimerSettingsSectionSignal.value = false;
    this._scrollToTimerSectionOnceSettled();
  }

  /**
   * `#timer-settings-section` sits below this screen's top bar, whose own children each
   * schedule their first Lit render as a separate microtask - so right after this element's own
   * `firstUpdated`, the target's `offsetTop` is still mid-layout-shift for a frame or two, and
   * scrolling immediately lands short. Polls via `requestAnimationFrame` (same idea as
   * `awaitTourTarget` in `tour-target.utility.ts`) until `offsetTop` stops changing between two
   * consecutive frames before scrolling.
   */
  private _scrollToTimerSectionOnceSettled(maxFrames = 10): void {
    let frame = 0;
    let lastOffsetTop = -1;

    const tick = (): void => {
      const el = this._timerSectionEl;
      if (!el) return;

      frame += 1;
      if (el.offsetTop === lastOffsetTop || frame >= maxFrames) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      lastOffsetTop = el.offsetTop;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  /** "Timer" section - the default guided-timer count direction and whether the large step banner shows. */
  private _renderTimerSection(): HTMLTemplateResult {
    const countStyle = timerCountStyleSignal.value;

    return html`
      <div class="section-title" id="timer-settings-section">Timer</div>
      <div class="row">
        <span class="row-label">Default count style</span>
        <div class="feature-row-chips">
          <brew-chip
            label="Count down"
            ?selected="${countStyle === "countdown"}"
            @chip-click="${() => setTimerCountStyle("countdown")}"
          ></brew-chip>
          <brew-chip
            label="Count up"
            ?selected="${countStyle === "countup"}"
            @chip-click="${() => setTimerCountStyle("countup")}"
          ></brew-chip>
        </div>
      </div>
      <p class="section-hint">
        Applied when a new recipe is primed on the Timer screen - you can still switch modes for
        that session from the Timer screen itself.
      </p>

      <div class="row">
        <span class="row-label">Show large step banner</span>
        <brew-switch
          ?checked="${showActiveStepBannerSignal.value}"
          aria-label="Show large step banner"
          @change="${(e: CustomEvent<boolean>) => setShowActiveStepBanner(e.detail)}"
        ></brew-switch>
      </div>
    `;
  }

  private _renderConnectedDevicesSection(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    return html`
      <div class="divider"></div>
      <div class="section-title">Connected devices</div>
      <brew-device-connect-rows></brew-device-connect-rows>
    `;
  }

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar
          title="General"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
          ${this._renderTimerSection()}

          <div class="divider"></div>
          <div class="section-title">App</div>
          <p class="section-hint">
            BrewMe checks for updates automatically and will show a prompt when a new version's
            ready. If you don't see it but suspect there's an update, force a refresh here.
          </p>
          <brew-button variant="outlined" @button-click="${refreshApp}">Refresh app</brew-button>

          ${this._renderConnectedDevicesSection()}

          <div class="divider"></div>
          <div class="section-title">Support BrewMe</div>
          <brew-support-card></brew-support-card>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
