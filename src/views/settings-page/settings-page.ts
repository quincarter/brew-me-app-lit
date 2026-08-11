import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
import "../../components/list-row/brew-list-row";
import "../../components/switch/brew-switch";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import { BREW_TYPES } from "../../shared/data/brew-content.data";
import {
  addCustomBrewType,
  customBrewTypesSignal,
  deleteAllCustomBrewTypes,
  deleteCustomBrewType,
} from "../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../shared/stores/brew.store";
import { isDarkThemeSignal, setDarkTheme } from "../../shared/stores/theme.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { exportAppData, importAppData } from "../../shared/utilities/export-data.utility";
import { refreshApp } from "../../shared/utilities/register-service-worker.utility";
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

  render(): HTMLTemplateResult {
    const customTypes = customBrewTypesSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar title="Settings" icon="arrow_back" href="/more"></brew-top-bar>

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
                    <brew-icon name="close" size="14"></brew-icon>
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

          <div class="divider"></div>
          <div class="section-title">Recipes</div>
          <p class="section-hint">
            Curated recipes from World competitions and coffee experts.
          </p>
          <brew-list-row
            headline="WAC Recipes"
            supporting="World AeroPress Championship winners"
            leading-icon="menu_book"
            href="/more/aeropress-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="V60 Recipes"
            supporting="Expert pour-over recipes compared"
            leading-icon="menu_book"
            href="/more/v60-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Origami Recipes"
            supporting="Champion &amp; barista dripper recipes"
            leading-icon="menu_book"
            href="/more/origami-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Kalita Wave Recipes"
            supporting="Champion &amp; roastery dripper recipes"
            leading-icon="menu_book"
            href="/more/kalita-wave-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Chemex Recipes"
            supporting="Expert &amp; roastery glass dripper recipes"
            leading-icon="menu_book"
            href="/more/chemex-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Clever Dripper Recipes"
            supporting="Immersion &amp; barista dripper recipes"
            leading-icon="menu_book"
            href="/more/clever-dripper-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="Hario Switch Recipes"
            supporting="Hybrid immersion &amp; WBrC champion recipes"
            leading-icon="menu_book"
            href="/more/hario-switch-recipes"
          ></brew-list-row>
          <brew-list-row
            headline="World Barista Championship"
            supporting="2026 Panama events &amp; competition videos"
            leading-icon="emoji_events"
            href="/more/wbc-videos"
          ></brew-list-row>

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

          <div class="divider"></div>
          <div class="section-title">App</div>
          <p class="section-hint">
            BrewMe checks for updates automatically and will show a prompt when a new version's
            ready. If you don't see it but suspect there's an update, force a refresh here.
          </p>
          <brew-button variant="outlined" @button-click="${refreshApp}">Refresh app</brew-button>

          <div class="divider"></div>
          <div class="section-title">Data</div>
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
