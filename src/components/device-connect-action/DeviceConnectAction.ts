import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import { CLOSE_ICON } from "../../shared/icons/icons";
import type { BookooConnectionState } from "../../shared/interfaces/bookoo-ble.interface";
import { DeviceConnectActionStyles } from "./device-connect-action.styles";

/**
 * # Device Connect Action
 * The connect/cancel/disconnect control for a Bookoo BLE device row - shared
 * between the Timer page's devices row and Settings' "Connected devices"
 * section so the connect-affordance logic lives in one place.
 * @element brew-device-connect-action
 * @fires connect-click - Fired when tapped while disconnected.
 * @fires disconnect-click - Fired when tapped while connecting (cancel) or connected (disconnect).
 */
export class DeviceConnectAction extends LitElement {
  static styles = [DeviceConnectActionStyles];

  @property({ type: String }) state: BookooConnectionState = "disconnected";

  private _onConnectClick = (): void => {
    this.dispatchEvent(new CustomEvent("connect-click", { bubbles: true, composed: true }));
  };

  private _onDisconnectClick = (): void => {
    this.dispatchEvent(new CustomEvent("disconnect-click", { bubbles: true, composed: true }));
  };

  render(): HTMLTemplateResult {
    if (this.state === "connected") {
      return html`
        <brew-icon-button
          .svgIcon="${CLOSE_ICON}"
          size="14"
          style="--icon-button-size: 24px"
          aria-label="Disconnect"
          @icon-click="${this._onDisconnectClick}"
        ></brew-icon-button>
      `;
    }

    return html`
      <brew-button
        variant="text"
        @button-click="${this.state === "connecting" ? this._onDisconnectClick : this._onConnectClick}"
        >${this.state === "connecting" ? "Cancel" : "Connect"}</brew-button
      >
    `;
  }
}
