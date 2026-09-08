import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/button/brew-button";
import "../../components/chip/brew-chip";
import "../../components/icon/brew-icon";
import "../../components/switch/brew-switch";
import "../../components/text-field/brew-text-field";
import "../../components/top-bar/brew-top-bar";
import "../../components/bottom-nav/brew-bottom-nav";
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
  deleteCustomBrewType,
} from "../../shared/stores/brew-types.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { isWebBluetoothSupported } from "../../shared/utilities/web-bluetooth.utility";
import { BrewTypeSettingsPageStyles } from "./brew-type-settings-page.styles";

/**
 * Brew Type Settings screen (`/more/settings/brew-types`) - everything about
 * the set of brew types themselves (add/remove custom ones) and their
 * per-type feature toggles, split out of the old monolithic Settings screen
 * so that screen could become a category hub. Reached from Settings, which
 * keeps its own bottom nav visible - this screen does too (with `more` still
 * highlighted), same convention as Home Screen Configurator and Cloud Sync's
 * own settings detail screens.
 */
@customElement("brew-type-settings-page")
export class BrewTypeSettingsPage extends SignalWatcher(LitElement) {
  static styles = [BrewTypeSettingsPageStyles, responsiveScreenStyles];

  @state() private _addingType = false;
  @state() private _typeDraft = "";

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

  render(): HTMLTemplateResult {
    const customTypes = customBrewTypesSignal.value;

    return html`
      <div class="screen">
        <brew-top-bar
          title="Brew Type Settings"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

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
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
