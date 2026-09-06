import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/cloud-sync-provider-row/brew-cloud-sync-provider-row";
import "../../components/top-bar/brew-top-bar";
import type { CloudProviderId } from "../../shared/interfaces/cloud-sync.interface";
import {
  cloudSyncStateSignal,
  connectProvider,
  disconnectProvider,
  syncNow,
} from "../../shared/stores/cloud-sync.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { getConfiguredCloudProviders } from "../../shared/utilities/cloud-provider-config.utility";
import { formatRelativeDay } from "../../shared/utilities/relative-date.utility";
import { CloudSyncPageStyles } from "./cloud-sync-page.styles";

/** Google's public-client OAuth caps refresh tokens more aggressively than Dropbox/Microsoft while its consent screen is in "Testing" status - shipped anyway as beta rather than blocked on Google's app-verification process. */
const GOOGLE_DRIVE_NOTE = "May need reconnecting periodically.";

/**
 * Cloud Sync settings screen (`/more/cloud-sync`) - connect/disconnect a
 * cloud storage provider for automatic background sync of saved brews plus
 * custom brew types/step labels. All three providers (Dropbox, OneDrive,
 * Google Drive) are wired up as of Phase 2. Reached from Settings, which
 * keeps its own bottom nav visible - this screen does too (with `more`
 * still highlighted) so drilling in doesn't lose the tab bar.
 */
@customElement("cloud-sync-page")
export class CloudSyncPage extends SignalWatcher(LitElement) {
  static styles = [CloudSyncPageStyles, responsiveScreenStyles];

  @state() private _syncing = false;

  private _onConnectClick = (providerId: CloudProviderId): void => {
    // `connectProvider` already records the failure into the provider's own
    // status before rethrowing - this catch exists only to prevent an
    // unhandled rejection, the render below is what actually surfaces it.
    connectProvider(providerId).catch(() => {});
  };

  private _onDisconnectClick = (providerId: CloudProviderId): void => {
    void disconnectProvider(providerId);
  };

  private _onSyncNowClick = async (): Promise<void> => {
    this._syncing = true;
    try {
      await syncNow();
    } finally {
      this._syncing = false;
    }
  };

  render(): HTMLTemplateResult {
    const syncState = cloudSyncStateSignal.value;
    const activeProviderId = syncState.activeProviderId;
    const activeStatus = activeProviderId ? syncState.statuses[activeProviderId] : undefined;
    const configuredProviders = getConfiguredCloudProviders();

    return html`
      <div class="screen">
        <brew-top-bar
          title="Cloud Sync"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
          <p class="section-hint">
            Connect a cloud storage account you already own to automatically back up saved brews,
            scale-captured brew curves, custom brew types, and custom step labels across your
            devices. Only one provider can be connected at a time - connecting a new one replaces
            the current connection. The Export/Import buttons in Settings still work independently
            as a manual fallback.
          </p>

          <p class="section-hint">Google Drive Sync and OneDrive Sync are coming soon.</p>

          ${
            configuredProviders.length === 0
              ? html`<p class="section-hint">
                  No cloud providers are configured for this build yet - check back later.
                </p>`
              : html`
                  <div class="rows">
                    ${configuredProviders.map(
                      (providerId, index) => html`
                        ${index > 0 ? html`<div class="divider"></div>` : null}
                        <brew-cloud-sync-provider-row
                          provider="${providerId}"
                          ?connected="${Boolean(syncState.connections[providerId])}"
                          account-label="${syncState.connections[providerId]?.accountLabel ?? ""}"
                          .status="${syncState.statuses[providerId]}"
                          note="${providerId === "google-drive" ? GOOGLE_DRIVE_NOTE : ""}"
                          @connect-click="${() => this._onConnectClick(providerId)}"
                          @disconnect-click="${() => this._onDisconnectClick(providerId)}"
                        ></brew-cloud-sync-provider-row>
                      `,
                    )}
                  </div>
                `
          }
          ${
            activeProviderId
              ? html`
                  <div class="sync-now-row">
                    <p class="section-hint">
                      ${
                        activeStatus?.lastSyncedAt
                          ? `Last synced ${formatRelativeDay(activeStatus.lastSyncedAt)}`
                          : "Not synced yet."
                      }
                    </p>
                    <brew-button
                      variant="outlined"
                      ?disabled="${this._syncing || activeStatus?.status === "syncing"}"
                      @button-click="${this._onSyncNowClick}"
                      >${
                        this._syncing || activeStatus?.status === "syncing"
                          ? "Syncing…"
                          : "Sync now"
                      }</brew-button
                    >
                  </div>
                `
              : null
          }
          ${
            activeStatus?.status === "error" && activeStatus.lastError
              ? html`<p class="status-text error">${activeStatus.lastError}</p>`
              : null
          }
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
