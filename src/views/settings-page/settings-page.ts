import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/list-row/brew-list-row";
import "../../components/support-card/brew-support-card";
import "../../components/top-bar/brew-top-bar";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { SettingsPageStyles } from "./settings-page.styles";

/**
 * Settings hub (`/more/settings`) - a category menu into the four settings
 * sub-screens, replacing what used to be one long scrolling page as the
 * app's settings surface grew (brew types, appearance, timer, connected
 * devices, cloud sync, data management, ...). Each category keeps its own
 * `settings-page`-style top bar/bottom nav, same convention Home Screen
 * Configurator and Cloud Sync already use for a settings detail screen.
 */
@customElement("settings-page")
export class SettingsPage extends LitElement {
  static styles = [SettingsPageStyles, responsiveScreenStyles];

  render(): HTMLTemplateResult {
    return html`
      <div class="screen">
        <brew-top-bar title="Settings" .icon="${ARROW_BACK_ICON_SVG}" href="/more"></brew-top-bar>

        <div class="content">
          <brew-list-row
            headline="Brew Type Settings"
            supporting="Brew types and per-type feature toggles"
            leading-icon="coffee"
            href="/more/settings/brew-types"
          ></brew-list-row>
          <brew-list-row
            headline="Display"
            supporting="Dark mode and Home screen layout"
            leading-icon="palette"
            href="/more/settings/display"
          ></brew-list-row>
          <brew-list-row
            headline="Data"
            supporting="Cloud sync, export/import, danger zone"
            leading-icon="database"
            href="/more/settings/data"
          ></brew-list-row>
          <brew-list-row
            headline="General"
            supporting="Timer, connected devices, app, and support"
            leading-icon="tune"
            href="/more/settings/general"
          ></brew-list-row>

          <div class="divider"></div>
          <div class="section-title">Support BrewMe</div>
          <brew-support-card></brew-support-card>
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
