import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/icon/brew-icon";
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
import { refreshApp } from "../../shared/utilities/register-service-worker.utility";
import { SettingsPageStyles } from "./settings-page.styles";

@customElement("settings-page")
export class SettingsPage extends SignalWatcher(LitElement) {
  static styles = [SettingsPageStyles, responsiveScreenStyles];

  @state() private _addingType = false;
  @state() private _typeDraft = "";
  @state() private _confirmingDelete = false;

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

          ${this._addingType
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
              `}

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
            BrewMe updates itself automatically in the background. If something seems out of
            date, force a refresh here.
          </p>
          <brew-button variant="outlined" @button-click="${refreshApp}">Refresh app</brew-button>

          <div class="divider"></div>
          <div class="danger-zone">
            <div class="section-title danger">Danger zone</div>
            ${this._confirmingDelete
              ? html`
                  <p class="section-hint">
                    This permanently deletes all saved brews and custom brew types on this
                    device. This can't be undone.
                  </p>
                  <div class="add-actions">
                    <brew-button variant="text" @button-click="${() => {
                      this._confirmingDelete = false;
                    }}"
                      >Cancel</brew-button
                    >
                    <brew-button variant="filled" tone="danger" @button-click="${this._onDeleteAllData}"
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
                `}
          </div>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
