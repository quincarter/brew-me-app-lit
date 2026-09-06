import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../button/brew-button";
import "../icon-button/brew-icon-button";
import { CLOSE_ICON } from "../../shared/icons/icons";
import type {
  CloudProviderId,
  IProviderSyncStatus,
} from "../../shared/interfaces/cloud-sync.interface";
import { getCloudProviderLabel } from "../../shared/utilities/cloud-provider-label.utility";
import { formatRelativeDay } from "../../shared/utilities/relative-date.utility";
import { CloudSyncProviderRowStyles } from "./cloud-sync-provider-row.styles";

/**
 * # Cloud Sync Provider Row
 * One provider's row on the Cloud Sync screen - name, connection/account
 * state, and a connect/disconnect control modeled directly on
 * `brew-device-connect-action`'s state machine (a "Connect" text button
 * while disconnected, a small icon button to disconnect once connected).
 * `disabled` renders a "Coming soon" stub row for a provider that isn't
 * wired up yet. `note` renders a small persistent secondary line below the
 * usual status text - shown regardless of connection state - for a
 * provider-specific caveat that should always stay visible (e.g. Google
 * Drive's "may need reconnecting periodically").
 * @element brew-cloud-sync-provider-row
 * @fires connect-click - Fired when tapped while disconnected (and not disabled).
 * @fires disconnect-click - Fired when tapped while connected.
 */
export class CloudSyncProviderRow extends LitElement {
  static styles = [CloudSyncProviderRowStyles];

  @property({ type: String }) provider: CloudProviderId = "dropbox";
  @property({ type: Boolean, reflect: true }) connected = false;
  @property({ type: String, attribute: "account-label" }) accountLabel = "";
  @property({ attribute: false }) status?: IProviderSyncStatus;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) note = "";

  private _onConnectClick = (): void => {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent("connect-click", { bubbles: true, composed: true }));
  };

  private _onDisconnectClick = (): void => {
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent("disconnect-click", { bubbles: true, composed: true }));
  };

  private _renderSupporting(): HTMLTemplateResult {
    if (this.disabled) {
      return html`<span class="supporting">Coming soon</span>`;
    }

    // Checked before the "not connected" fallback below - a connect-time
    // failure (e.g. a missing client id) leaves `connected: false`, so
    // without this ordering the row would silently show "Not connected"
    // instead of the actual reason it failed.
    if (this.status?.status === "error" && this.status.lastError) {
      return html`<span class="supporting error">${this.status.lastError}</span>`;
    }

    if (!this.connected) {
      return html`<span class="supporting">Not connected</span>`;
    }

    const parts = [this.accountLabel || "Connected"];
    if (this.status?.status === "syncing") {
      parts.push("Syncing…");
    } else if (this.status?.lastSyncedAt) {
      parts.push(`Synced ${formatRelativeDay(this.status.lastSyncedAt)}`);
    }

    return html`<span class="supporting">${parts.join(" · ")}</span>`;
  }

  render(): HTMLTemplateResult {
    const label = getCloudProviderLabel(this.provider);

    return html`
      <div class="row">
        <div class="row-text">
          <span class="headline">${label}</span>
          ${this._renderSupporting()}
          ${this.note ? html`<span class="note">${this.note}</span>` : null}
        </div>
        ${
          this.connected
            ? html`
                <brew-icon-button
                  .svgIcon="${CLOSE_ICON}"
                  size="14"
                  style="--icon-button-size: 24px"
                  aria-label="Disconnect ${label}"
                  @icon-click="${this._onDisconnectClick}"
                ></brew-icon-button>
              `
            : html`
                <brew-button
                  variant="text"
                  ?disabled="${this.disabled}"
                  @button-click="${this._onConnectClick}"
                  >Connect</brew-button
                >
              `
        }
      </div>
    `;
  }
}
