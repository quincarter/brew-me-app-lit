import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon-button/brew-icon-button";
import "../icon/brew-icon";
import { TopBarStyles } from "./top-bar.styles";
import {
  BLUETOOTH_ICON_SVG,
  LOCAL_CAFE_ICON_SVG,
  MONITOR_WEIGHT_ICON_SVG,
  PRESSURE_MONITOR_ICON_SVG,
} from "../../shared/icons/icons";
import {
  monitorConnectionStateSignal,
  scaleConnectionStateSignal,
} from "../../shared/stores/device-connection.store";
import { openDeviceConnectSheet } from "../../shared/stores/device-connect-sheet.store";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";

/**
 * # Top Bar
 * The screen header used on every non-home BrewMe screen: a leading
 * icon-link (home or back) plus a title. Also always carries a tappable
 * BLE device-status control (when Web Bluetooth is supported) that opens
 * `brew-device-connect-sheet` to connect/disconnect devices without
 * navigating to Settings.
 * ## Usage
 * ```html
 * <brew-top-bar title="Calculator"></brew-top-bar>
 * <brew-top-bar title="Saved Brews" icon="arrow_back" href="/saved"></brew-top-bar>
 * <!-- trailing slot: small status content after the title, in addition to the device-status control -->
 * <brew-top-bar title="Pour-over Timer">
 *   <span slot="trailing">...</span>
 * </brew-top-bar>
 * ```
 * @element brew-top-bar
 * @slot trailing - Optional compact content placed after the device-status control (badges, extra status).
 */
export class TopBar extends SignalWatcher(LitElement) {
  static styles = [TopBarStyles];

  @property({ type: String }) title = "";
  @property({ type: String }) icon: SVGTemplateResult = LOCAL_CAFE_ICON_SVG;
  @property({ type: String }) href = "/";
  @property({ type: String, attribute: "aria-label-text" }) ariaLabelText = "Home";

  /**
   * The always-present BLE device-status control - a single button (not a
   * group of separate icon buttons) so it carries one `aria-label`
   * describing overall connection state plus the tap action, rather than
   * exposing each icon as its own accessible element.
   */
  private _renderDeviceStatus(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    const scaleConnected = scaleConnectionStateSignal.value === "connected";
    const monitorConnected = monitorConnectionStateSignal.value === "connected";

    let ariaLabel: string;
    if (scaleConnected && monitorConnected) {
      ariaLabel = "Bookoo Scale and Espresso Monitor connected. Manage connected devices.";
    } else if (scaleConnected) {
      ariaLabel = "Bookoo Scale connected. Manage connected devices.";
    } else if (monitorConnected) {
      ariaLabel = "Espresso Monitor connected. Manage connected devices.";
    } else {
      ariaLabel = "Connect your devices";
    }

    return html`
      <button
        type="button"
        class="device-status"
        aria-label="${ariaLabel}"
        @click="${openDeviceConnectSheet}"
      >
        ${
          !scaleConnected && !monitorConnected
            ? html`<brew-icon
                .svg="${BLUETOOTH_ICON_SVG}"
                size="20"
                aria-hidden="true"
              ></brew-icon>`
            : html`
                ${
                  scaleConnected
                    ? html`<brew-icon
                        .svg="${MONITOR_WEIGHT_ICON_SVG}"
                        size="20"
                        aria-hidden="true"
                      ></brew-icon>`
                    : nothing
                }
                ${
                  monitorConnected
                    ? html`<brew-icon
                        .svg="${PRESSURE_MONITOR_ICON_SVG}"
                        size="20"
                        aria-hidden="true"
                      ></brew-icon>`
                    : nothing
                }
              `
        }
      </button>
    `;
  }

  render(): HTMLTemplateResult {
    return html`
      <div class="bar">
        <brew-icon-button
          .svgIcon="${this.icon}"
          href="${this.href}"
          aria-label="${this.ariaLabelText}"
        ></brew-icon-button>
        <span class="title">${this.title}</span>
        <div class="trailing">${this._renderDeviceStatus()}<slot name="trailing"></slot></div>
      </div>
    `;
  }
}
