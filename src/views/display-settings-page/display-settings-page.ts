import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/list-row/brew-list-row";
import "../../components/switch/brew-switch";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { isDarkThemeSignal, setDarkTheme } from "../../shared/stores/theme.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { DisplaySettingsPageStyles } from "./display-settings-page.styles";

/**
 * Display Settings screen (`/more/settings/display`) - appearance and the
 * Home screen layout, split out of the old monolithic Settings screen so
 * that screen could become a category hub. Reached from Settings, which
 * keeps its own bottom nav visible - this screen does too (with `more` still
 * highlighted), same convention as Home Screen Configurator and Cloud Sync's
 * own settings detail screens.
 */
@customElement("display-settings-page")
export class DisplaySettingsPage extends SignalWatcher(LitElement) {
  static styles = [DisplaySettingsPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar
          title="Display"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
          <div class="section-title">Appearance</div>
          <div class="row">
            <span class="row-label">Dark mode</span>
            <brew-switch
              ?checked="${isDarkThemeSignal.value}"
              aria-label="Dark mode"
              @change="${(e: CustomEvent<boolean>) => setDarkTheme(e.detail)}"
            ></brew-switch>
          </div>
          <brew-list-row
            headline="Home Screen"
            supporting="Reorder or hide cards shown on Home"
            leading-icon="dashboard_customize"
            href="/more/settings/home-screen"
          ></brew-list-row>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
