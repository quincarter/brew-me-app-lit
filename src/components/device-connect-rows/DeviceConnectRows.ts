import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import "../connection-status-pill/brew-connection-status-pill";
import "../device-connect-action/brew-device-connect-action";
import {
  connectMonitor,
  connectScale,
  disconnectMonitor,
  disconnectScale,
  monitorConnectionStateSignal,
  scaleConnectionStateSignal,
} from "../../shared/stores/device-connection.store";
import { DeviceConnectRowsStyles } from "./device-connect-rows.styles";

/**
 * # Device Connect Rows
 * The two BLE device rows (Bookoo Scale, Espresso Monitor) - each a label
 * plus a `brew-connection-status-pill` and `brew-device-connect-action`,
 * wired straight to `device-connection.store`. The single source of truth
 * for "the two device rows," reused by both Settings' "Connected devices"
 * section and `brew-device-connect-sheet` so the markup isn't duplicated.
 * @element brew-device-connect-rows
 */
export class DeviceConnectRows extends SignalWatcher(LitElement) {
  static styles = [DeviceConnectRowsStyles];

  render(): HTMLTemplateResult {
    return html`
      <div class="row">
        <span class="row-label">Bookoo Scale</span>
        <div class="device-controls">
          <brew-connection-status-pill
            state="${scaleConnectionStateSignal.value}"
          ></brew-connection-status-pill>
          <brew-device-connect-action
            state="${scaleConnectionStateSignal.value}"
            @connect-click="${connectScale}"
            @disconnect-click="${disconnectScale}"
          ></brew-device-connect-action>
        </div>
      </div>
      <div class="row">
        <span class="row-label">Espresso Monitor</span>
        <div class="device-controls">
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
}
