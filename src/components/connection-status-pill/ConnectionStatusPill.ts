import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { BookooConnectionState } from "../../shared/interfaces/bookoo-ble.interface";
import { ConnectionStatusPillStyles } from "./connection-status-pill.styles";

const STATE_LABELS: Record<BookooConnectionState, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
};

/**
 * # Connection Status Pill
 * A compact dot + label badge showing a Bookoo BLE device's connection
 * state - used on the Timer screen's devices row and Settings' "Connected
 * devices" section.
 * @element brew-connection-status-pill
 */
export class ConnectionStatusPill extends LitElement {
  static styles = [ConnectionStatusPillStyles];

  @property({ type: String, reflect: true }) state: BookooConnectionState = "disconnected";

  render(): HTMLTemplateResult {
    return html`
      <span class="dot"></span>
      <span class="label">${STATE_LABELS[this.state]}</span>
    `;
  }
}
