import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import "../bottom-sheet/brew-bottom-sheet";
import "../device-connect-rows/brew-device-connect-rows";
import {
  closeDeviceConnectSheet,
  deviceConnectSheetOpenSignal,
} from "../../shared/stores/device-connect-sheet.store";
import { DeviceConnectSheetStyles } from "./device-connect-sheet.styles";

/**
 * # Device Connect Sheet
 * A globally-rendered bottom sheet (mobile) / centered modal (≥840px) for
 * connecting or disconnecting BLE devices from anywhere in the app, opened
 * by tapping the device-status control in `brew-top-bar`. Reads and drives
 * `device-connect-sheet.store` directly, same pattern as `brew-post-save-sheet`
 * and its `post-save-sheet.store`.
 * @element brew-device-connect-sheet
 */
export class DeviceConnectSheet extends SignalWatcher(LitElement) {
  static styles = [DeviceConnectSheetStyles];

  render(): HTMLTemplateResult {
    return html`
      <brew-bottom-sheet
        ?open="${deviceConnectSheetOpenSignal.value}"
        label="Connect your devices"
        @sheet-scrim-click="${closeDeviceConnectSheet}"
      >
        <div class="header">
          <span class="header-title">Connect your devices</span>
          <p class="header-hint">
            Pair a Bookoo Scale or Espresso Monitor to see live weight and pressure while you brew.
          </p>
        </div>
        <brew-device-connect-rows></brew-device-connect-rows>
      </brew-bottom-sheet>
    `;
  }
}
