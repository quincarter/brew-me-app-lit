import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/chip/brew-chip";
import "../../components/device-connect-rows/brew-device-connect-rows";
import "../../components/icon/brew-icon";
import "../../components/list-row/brew-list-row";
import "../../components/support-card/brew-support-card";
import "../../components/switch/brew-switch";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import { BREW_TYPES } from "../../shared/data/brew-content.data";
import { ARROW_BACK_ICON_SVG, CLOSE_ICON } from "../../shared/icons/icons";
import {
  getBrewTypeFeatures,
  isBrewTypeFeaturesLocked,
  setShowShotsSection,
  setTelemetryMode,
} from "../../shared/stores/brew-type-features.store";
import {
  addCustomBrewType,
  customBrewTypesSignal,
  deleteAllCustomBrewTypes,
  deleteCustomBrewType,
} from "../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../shared/stores/brew.store";
import { isDarkThemeSignal, setDarkTheme } from "../../shared/stores/theme.store";
import {
  scrollToTimerSettingsSectionSignal,
  setShowActiveStepBanner,
  setTimerCountStyle,
  showActiveStepBannerSignal,
  timerCountStyleSignal,
} from "../../shared/stores/timer-settings.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { isAnyCloudProviderConfigured } from "../../shared/utilities/cloud-provider-config.utility";
import { exportAppData, importAppData } from "../../shared/utilities/export-data.utility";
import { refreshApp } from "../../shared/utilities/register-service-worker.utility";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
import { SettingsPageStyles } from "./settings-page.styles";

@customElement("settings-page")
export class SettingsPage extends SignalWatcher(LitElement) {
  static styles = [SettingsPageStyles, responsiveScreenStyles];

  @state() private _addingType = false;
  @state() private _typeDraft = "";
  @state() private _confirmingDelete = false;
  @state() private _statusText = "";
  @state() private _confirmingImport = false;
  @state() private _pendingImportFile: File | null = null;

  @query("input[type='file']") private _fileInput!: HTMLInputElement;
  @query("#timer-settings-section") private _timerSectionEl?: HTMLElement;

  private _statusTimeout: ReturnType<typeof setTimeout> | undefined;

  /** Consumes a pending scroll-to-Timer-section request from the Timer screen's settings shortcut - see `scrollToTimerSettingsSectionSignal`'s doc comment. */
  protected firstUpdated(): void {
    if (!scrollToTimerSettingsSectionSignal.value) return;
    scrollToTimerSettingsSectionSignal.value = false;
    this._scrollToTimerSectionOnceSettled();
  }

  /**
   * `#timer-settings-section` sits below the "Brew type features" rows, whose own
   * `brew-switch`/`brew-chip` children each schedule their first Lit render as a separate
   * microtask - so right after this element's own `firstUpdated`, the target's `offsetTop` is
   * still mid-layout-shift for a frame or two, and scrolling immediately lands short. Polls via
   * `requestAnimationFrame` (same idea as `awaitTourTarget` in `tour-target.utility.ts`) until
   * `offsetTop` stops changing between two consecutive frames before scrolling.
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

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._statusTimeout);
  }

  private _showStatus(text: string): void {
    clearTimeout(this._statusTimeout);
    this._statusText = text;
    if (!text) return;
    this._statusTimeout = setTimeout(() => {
      this._statusText = "";
    }, 2500);
  }

  private _onExportData = async (): Promise<void> => {
    try {
      await exportAppData();
      this._showStatus("Exported!");
    } catch {
      this._showStatus("Couldn't export — try again.");
    }
  };

  private _onChooseImportFile = (): void => {
    this._fileInput.click();
  };

  private _onImportFileSelected = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = "";
    if (!file) return;

    this._pendingImportFile = file;
    this._confirmingImport = true;
  };

  private _cancelImport = (): void => {
    this._pendingImportFile = null;
    this._confirmingImport = false;
  };

  private _confirmImport = async (): Promise<void> => {
    if (!this._pendingImportFile) return;

    try {
      await importAppData(this._pendingImportFile);
      this._showStatus("Imported! Reloading…");
      window.location.reload();
    } catch {
      this._showStatus("Couldn't import — check the file and try again.");
      this._pendingImportFile = null;
      this._confirmingImport = false;
    }
  };

  private _startAddType = (): void => {
    this._addingType = true;
    this._typeDraft = "";
  };

  private _cancelAddType = (): void => {
    this._addingType = false;
    this._typeDraft = "";
  };

  private _confirmAddType = (): void => {
    addCustomBrewType(this._typeDraft);
    this._addingType = false;
    this._typeDraft = "";
  };

  private _onDeleteAllData = (): void => {
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
    this._confirmingDelete = false;
  };

  /** One brew type's row within the "Brew type features" section - locked types (e.g. Aeropress) render disabled with a hint instead of an editable switch/chips. */
  private _renderBrewTypeFeaturesRow(name: string): HTMLTemplateResult {
    const locked = isBrewTypeFeaturesLocked(name);
    const features = getBrewTypeFeatures(name);

    return html`
      <div class="feature-row">
        <span class="row-label">${name}</span>

        <div class="row">
          <span class="feature-row-sublabel">Show Brews/Shots section</span>
          <brew-switch
            ?checked="${features.showShotsSection}"
            ?disabled="${locked}"
            aria-label="Show Brews/Shots section for ${name}"
            @change="${(e: CustomEvent<boolean>) => setShowShotsSection(name, e.detail)}"
          ></brew-switch>
        </div>

        <div class="feature-row-telemetry">
          <span class="feature-row-sublabel">Timer telemetry</span>
          <div class="feature-row-chips">
            <brew-chip
              label="Off"
              ?selected="${features.telemetryMode === "off"}"
              ?disabled="${locked}"
              @chip-click="${() => setTelemetryMode(name, "off")}"
            ></brew-chip>
            <brew-chip
              label="Gauges + chart"
              ?selected="${features.telemetryMode === "full"}"
              ?disabled="${locked}"
              @chip-click="${() => setTelemetryMode(name, "full")}"
            ></brew-chip>
            <brew-chip
              label="Chart only"
              ?selected="${features.telemetryMode === "chart-only"}"
              ?disabled="${locked}"
              @chip-click="${() => setTelemetryMode(name, "chart-only")}"
            ></brew-chip>
          </div>
        </div>

        ${
          locked
            ? html`<p class="section-hint">Telemetry can't be tracked for ${name} yet.</p>`
            : nothing
        }
      </div>
    `;
  }

  private _renderBrewTypeFeaturesSection(): HTMLTemplateResult | typeof nothing {
    if (!isWebBluetoothSupported()) return nothing;

    const allTypes = [...BREW_TYPES, ...customBrewTypesSignal.value];

    return html`
      <div class="divider"></div>
      <div class="section-title">Brew type features</div>
      <p class="section-hint">
        Control which optional sections show up per brew type - useful for methods that can't
        support every feature.
      </p>
      <div class="feature-rows">
        ${allTypes.map((name) => this._renderBrewTypeFeaturesRow(name))}
      </div>
    `;
  }

  /** "Timer" section - the default guided-timer count direction and whether the large step banner shows. Not Bluetooth-gated, unlike the sections above/below it. */
  private _renderTimerSection(): HTMLTemplateResult {
    const countStyle = timerCountStyleSignal.value;

    return html`
      <div class="divider"></div>
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

  /** Hidden entirely when no cloud provider has a configured client id for this build - the feature toggle, see `isAnyCloudProviderConfigured`'s doc comment. */
  private _renderCloudSyncRow(): HTMLTemplateResult | typeof nothing {
    if (!isAnyCloudProviderConfigured()) return nothing;

    return html`
      <brew-list-row
        headline="Cloud Sync"
        supporting="Automatically back up saved brews to Dropbox and more"
        leading-icon="cloud_sync"
        href="/more/cloud-sync"
      ></brew-list-row>
    `;
  }

  render(): HTMLTemplateResult {
    const customTypes = customBrewTypesSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Settings" .icon="${ARROW_BACK_ICON_SVG}" href="/more"></brew-top-bar>

        <div class="content">
          <div class="section-title">Brew types</div>
          <p class="section-hint">
            These show up as options when saving or editing a ratio. Built-in types can't be
            removed.
          </p>
          <div class="type-tags">
            ${BREW_TYPES.map((name) => html`<span class="type-tag">${name}</span>`)}
            ${customTypes.map(
              (name) => html`
                <span class="type-tag custom">
                  ${name}
                  <button
                    class="tag-remove"
                    type="button"
                    aria-label="Remove ${name}"
                    @click="${() => deleteCustomBrewType(name)}"
                  >
                    <brew-icon .svg="${CLOSE_ICON}" size="14"></brew-icon>
                  </button>
                </span>
              `,
            )}
          </div>

          ${
            this._addingType
              ? html`
                  <div class="add-row">
                    <brew-text-field
                      label="New brew type"
                      .value="${this._typeDraft}"
                      @value-change="${(e: CustomEvent<string>) => {
                        this._typeDraft = e.detail;
                      }}"
                    ></brew-text-field>
                    <div class="add-actions">
                      <brew-button variant="text" @button-click="${this._cancelAddType}"
                        >Cancel</brew-button
                      >
                      <brew-button
                        variant="filled"
                        ?disabled="${!this._typeDraft.trim()}"
                        @button-click="${this._confirmAddType}"
                        >Add</brew-button
                      >
                    </div>
                  </div>
                `
              : html`
                  <brew-button variant="outlined" @button-click="${this._startAddType}"
                    >Add brew type</brew-button
                  >
                `
          }
          ${this._renderBrewTypeFeaturesSection()}

          <div class="divider"></div>
          <div class="section-title">Appearance</div>
          <div class="row">
            <span class="row-label">Dark mode</span>
            <brew-switch
              ?checked="${isDarkThemeSignal.value}"
              aria-label="Dark mode"
              @change="${(e: CustomEvent<boolean>) => setDarkTheme(e.detail)}"
            ></brew-switch>
          </div>
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
          <div class="section-title">Data</div>
          ${this._renderCloudSyncRow()}
          <p class="section-hint">Download everything saved on this device as a JSON file.</p>
          <div class="data-actions">
            <brew-button variant="outlined" @button-click="${this._onExportData}"
              >Export data</brew-button
            >
            <brew-button variant="outlined" @button-click="${this._onChooseImportFile}"
              >Import data</brew-button
            >
          </div>
          <input
            type="file"
            accept="application/json,.json"
            hidden
            @change="${this._onImportFileSelected}"
          />
          ${
            this._confirmingImport && this._pendingImportFile
              ? html`
                  <p class="section-hint">
                    Importing "${this._pendingImportFile.name}" replaces all data on this device
                    with the contents of this file. This can't be undone.
                  </p>
                  <div class="add-actions">
                    <brew-button variant="text" @button-click="${this._cancelImport}"
                      >Cancel</brew-button
                    >
                    <brew-button variant="filled" @button-click="${this._confirmImport}"
                      >Yes, import and replace</brew-button
                    >
                  </div>
                `
              : null
          }
          ${this._statusText ? html`<p class="status-text">${this._statusText}</p>` : null}

          <div class="divider"></div>
          <div class="section-title">Support BrewMe</div>
          <brew-support-card></brew-support-card>

          <div class="divider"></div>
          <div class="danger-zone">
            <div class="section-title danger">Danger zone</div>
            ${
              this._confirmingDelete
                ? html`
                    <p class="section-hint">
                      This permanently deletes all saved brews and custom brew types on this device.
                      This can't be undone.
                    </p>
                    <div class="add-actions">
                      <brew-button
                        variant="text"
                        @button-click="${() => {
                          this._confirmingDelete = false;
                        }}"
                        >Cancel</brew-button
                      >
                      <brew-button
                        variant="filled"
                        tone="danger"
                        @button-click="${this._onDeleteAllData}"
                        >Yes, delete everything</brew-button
                      >
                    </div>
                  `
                : html`
                    <p class="section-hint">
                      Permanently erase all saved brews and custom brew types from this device.
                    </p>
                    <brew-button
                      variant="outlined"
                      tone="danger"
                      @button-click="${() => {
                        this._confirmingDelete = true;
                      }}"
                      >Delete all data</brew-button
                    >
                  `
            }
          </div>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
