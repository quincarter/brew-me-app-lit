import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/list-row/brew-list-row";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { deleteAllCustomBrewTypes } from "../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../shared/stores/brew.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { isAnyCloudProviderConfigured } from "../../shared/utilities/cloud-provider-config.utility";
import { exportAppData, importAppData } from "../../shared/utilities/export-data.utility";
import { DataSettingsPageStyles } from "./data-settings-page.styles";

/**
 * Data Settings screen (`/more/settings/data`) - cloud sync, export/import,
 * and the danger zone, split out of the old monolithic Settings screen so
 * that screen could become a category hub. Reached from Settings, which
 * keeps its own bottom nav visible - this screen does too (with `more` still
 * highlighted), same convention as Home Screen Configurator and Cloud Sync's
 * own settings detail screens.
 */
@customElement("data-settings-page")
export class DataSettingsPage extends SignalWatcher(LitElement) {
  static styles = [DataSettingsPageStyles, responsiveScreenStyles];

  @state() private _confirmingDelete = false;
  @state() private _statusText = "";
  @state() private _confirmingImport = false;
  @state() private _pendingImportFile: File | null = null;

  @query("input[type='file']") private _fileInput!: HTMLInputElement;

  private _statusTimeout: ReturnType<typeof setTimeout> | undefined;

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

  private _onDeleteAllData = (): void => {
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
    this._confirmingDelete = false;
  };

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
    return html`
      <div class="screen">
        <brew-top-bar
          title="Data"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
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
