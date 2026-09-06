import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing, type SVGTemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/action-tile/brew-action-tile";
import "../../components/avatar/brew-avatar";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/empty-state/brew-empty-state";
import "../../components/icon-button/brew-icon-button";
import "../../components/saved-card/brew-saved-card";
import "../../components/stat-tile/brew-stat-tile";
import "../../components/support-card/brew-support-card";
import type { ISavedBrew } from "../../shared/interfaces/brew.interface";
import {
  brewAgain,
  mostRecentlyBrewedSignal,
  recentSavedBrewsSignal,
  streakDaysSignal,
  totalBrewsSignal,
} from "../../shared/stores/brew.store";
import { cloudSyncStateSignal } from "../../shared/stores/cloud-sync.store";
import { openDeviceConnectSheet } from "../../shared/stores/device-connect-sheet.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { getAvatarColors, getInitial } from "../../shared/utilities/avatar-palette.utility";
import { getBrewDisplayName } from "../../shared/utilities/brew-display.utility";
import { getBrewTypeIcon } from "../../shared/utilities/brew-icon.utility";
import { isAnyCloudProviderConfigured } from "../../shared/utilities/cloud-provider-config.utility";
import { getCloudProviderLabel } from "../../shared/utilities/cloud-provider-label.utility";
import { formatRatio } from "../../shared/utilities/format-ratio.utility";
import { formatRelativeDay } from "../../shared/utilities/relative-date.utility";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
import { HomePageStyles } from "./home-page.styles";
import { REPLAY_ICON } from "../../shared/icons/replay.svg";
import {
  BLUETOOTH_ICON_SVG,
  BOOKMARK_ADDED_ICON_SVG,
  CALCULATE_ICON_SVG,
  CLOUD_DONE_ICON_SVG,
  CLOUD_ICON_SVG,
  CLOUD_OFF_ICON_SVG,
  LOCAL_FIRE_DEPARTMENT_SVG,
  SAVED_ICON_SVG,
  TIMER_ICON_SVG,
} from "../../shared/icons/icons";

/** A real time-of-day greeting instead of a hardcoded one. */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

@customElement("home-page")
export class HomePage extends SignalWatcher(LitElement) {
  static styles = [HomePageStyles, responsiveScreenStyles];

  private _renderBrewAgainCard(brew: ISavedBrew): HTMLTemplateResult {
    const relative = formatRelativeDay(brew.lastBrewedAt ?? brew.createdAt);
    const relativeLower = relative.charAt(0).toLowerCase() + relative.slice(1);

    return html`
      <a class="brew-again-card" data-tour="brew-again-card" href="/saved/${brew.id}">
        <brew-avatar
          initial="${getInitial(getBrewDisplayName(brew))}"
          background="var(--brew-color-surface)"
          foreground="var(--brew-color-on-primary-container)"
          size="48"
          .icon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
        ></brew-avatar>
        <span class="brew-again-text">
          <span class="brew-again-eyebrow">Brew again</span>
          <span class="brew-again-name"
            >${getBrewDisplayName(brew)} · ${formatRatio(brew.ratio)}</span
          >
          <span class="brew-again-meta">Last brewed ${relativeLower}</span>
        </span>
        <brew-icon-button
          .svgIcon="${REPLAY_ICON}"
          variant="filled"
          aria-label="Brew again"
          style="--icon-button-size: 44px"
          @click="${(event: Event) => {
            event.stopPropagation();
            event.preventDefault();
            brewAgain(brew);
          }}"
        ></brew-icon-button>
      </a>
    `;
  }

  /** A tile opening `brew-device-connect-sheet` - Home has its own header (no `brew-top-bar`), so it gets its own entry point to the same sheet everywhere else reaches via the top bar's device-status control. Hidden entirely on a Web-Bluetooth-unsupported browser, same as that control. */
  private _renderDeviceTile(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    return html`
      <brew-action-tile
        .svg="${BLUETOOTH_ICON_SVG}"
        label="Devices"
        tone="neutral"
        @tile-click="${openDeviceConnectSheet}"
      ></brew-action-tile>
    `;
  }

  /**
   * Icon + "Provider · status" summary for the Cloud Sync tile - kept as one
   * derivation (not two separate icon/text methods) so the icon and its
   * wording can't drift out of sync with each other. Mirrors
   * `CloudSyncProviderRow`'s supporting-text phrasing, but shortened (no raw
   * error message - there isn't room for one on a home-screen tile).
   */
  private _cloudSyncSummary(): { icon: SVGTemplateResult; sublabel: string } {
    const state = cloudSyncStateSignal.value;
    const providerId = state.activeProviderId;
    if (!providerId) {
      return { icon: CLOUD_OFF_ICON_SVG, sublabel: "Not connected" };
    }

    const label = getCloudProviderLabel(providerId);
    const status = state.statuses[providerId];

    if (status?.status === "error") {
      return { icon: CLOUD_OFF_ICON_SVG, sublabel: `${label} · Sync error` };
    }
    if (status?.status === "syncing") {
      return { icon: CLOUD_ICON_SVG, sublabel: `${label} · Syncing…` };
    }
    if (status?.lastSyncedAt) {
      return {
        icon: CLOUD_DONE_ICON_SVG,
        sublabel: `${label} · Synced ${formatRelativeDay(status.lastSyncedAt)}`,
      };
    }
    return { icon: CLOUD_ICON_SVG, sublabel: `${label} · Not synced yet` };
  }

  /**
   * A tile linking to the Cloud Sync settings screen - shown regardless of
   * Web Bluetooth support, since it's unrelated to a connected scale, but
   * hidden entirely when no provider has a configured client id for this
   * build (the feature toggle - see `isAnyCloudProviderConfigured`'s doc
   * comment). No point offering an entry point into a screen that can only
   * ever say "nothing is configured yet".
   */
  private _renderCloudSyncTile(): HTMLTemplateResult | typeof nothing {
    if (!isAnyCloudProviderConfigured()) return nothing;

    const { icon, sublabel } = this._cloudSyncSummary();

    return html`
      <brew-action-tile
        .svg="${icon}"
        label="Cloud Sync"
        sublabel="${sublabel}"
        tone="neutral"
        href="/more/cloud-sync"
      ></brew-action-tile>
    `;
  }

  render(): HTMLTemplateResult {
    const recent = recentSavedBrewsSignal.value;
    const mostRecent = mostRecentlyBrewedSignal.value;
    const deviceTile = this._renderDeviceTile();
    const cloudSyncTile = this._renderCloudSyncTile();
    const hasSecondaryActions = deviceTile !== nothing || cloudSyncTile !== nothing;

    return html`
      <div class="screen">
        <div class="scroll">
          <div class="greeting">
            <div class="eyebrow">${getGreeting()}</div>
            <div class="headline">Ready to brew?</div>
          </div>

          ${mostRecent ? this._renderBrewAgainCard(mostRecent) : nothing}

          <div class="actions" data-tour="home-actions">
            <brew-action-tile
              .svg="${CALCULATE_ICON_SVG}"
              label="Calculate"
              tone="primary"
              href="/calculate"
            ></brew-action-tile>
            <brew-action-tile
              .svg="${SAVED_ICON_SVG}"
              label="Saved Brews"
              tone="secondary"
              href="/saved"
            ></brew-action-tile>
            <brew-action-tile
              .svg="${TIMER_ICON_SVG}"
              label="Timer"
              tone="tertiary"
              href="/timer"
            ></brew-action-tile>
          </div>

          ${
            hasSecondaryActions
              ? html`<div class="secondary-actions">${deviceTile} ${cloudSyncTile}</div>`
              : null
          }

          <div class="stats">
            <brew-stat-tile
              .svg="${BOOKMARK_ADDED_ICON_SVG}"
              value="${totalBrewsSignal.value}"
              label="saved brews"
            ></brew-stat-tile>
            <brew-stat-tile
              .svg="${LOCAL_FIRE_DEPARTMENT_SVG}"
              value="${streakDaysSignal.value}"
              label="day streak"
            ></brew-stat-tile>
          </div>

          <div class="section-header">
            <span class="section-title">Recent brews</span>
            <a class="see-all" href="/saved">See all</a>
          </div>

          ${
            recent.length === 0
              ? html`<brew-empty-state class="recent-empty"></brew-empty-state>`
              : html`
                  <div class="recent-row">
                    ${recent.map((brew) => {
                      const colors = getAvatarColors(brew.id);
                      return html`
                        <brew-saved-card
                          href="/saved/${brew.id}"
                          brew-type="${getBrewDisplayName(brew)}"
                          ratio="${brew.ratio}"
                          coffee="${brew.coffee}"
                          water="${brew.water}"
                          oz="${brew.oz}"
                          avatar-initial="${getInitial(getBrewDisplayName(brew))}"
                          avatar-bg="${colors.background}"
                          avatar-fg="${colors.foreground}"
                          .avatarIcon="${getBrewTypeIcon(brew.brewType, brew.icon)}"
                          rating="${brew.rating ?? 0}"
                          ?replayable="${true}"
                          @replay-click="${() => brewAgain(brew)}"
                        ></brew-saved-card>
                      `;
                    })}
                  </div>
                `
          }

          <div class="support">
            <brew-support-card></brew-support-card>
          </div>
        </div>

        <brew-bottom-nav active="home"></brew-bottom-nav>
      </div>
    `;
  }
}
