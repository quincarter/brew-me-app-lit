import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import "../../components/bottom-nav/brew-bottom-nav";
import "../../components/button/brew-button";
import "../../components/home-screen-config-row/brew-home-screen-config-row";
import "../../components/top-bar/brew-top-bar";
import type { HomeScreenSectionId } from "../../shared/interfaces/home-screen-config.interface";
import {
  getAvailableHomeScreenConfig,
  HOME_SCREEN_SECTION_LABELS,
  moveHomeScreenSection,
  resetHomeScreenConfig,
  setHomeScreenSectionVisible,
} from "../../shared/stores/home-screen-config.store";
import { responsiveScreenStyles } from "../../shared/styles/responsive.styles";
import { ARROW_BACK_ICON_SVG } from "../../shared/icons/icons";
import { HomeScreenConfiguratorPageStyles } from "./home-screen-configurator-page.styles";

/**
 * Home Screen Configurator screen (`/more/settings/home-screen`) - reorder
 * and show/hide Home's cards. Reached from Settings, which keeps its own
 * bottom nav visible - this screen does too (with `more` still highlighted)
 * so drilling in doesn't lose the tab bar, same convention as Cloud Sync's
 * own settings detail screen.
 *
 * Only ever renders rows for sections `isHomeScreenSectionAvailable`
 * (via `getAvailableHomeScreenConfig`) - a section gated by a
 * progressive-enhancement check (Bluetooth-only `devices`, build-gated
 * `cloudSync`) never appears as a toggle at all on a browser/build that
 * can't show it, rather than offering a switch that can't do anything.
 */
@customElement("home-screen-configurator-page")
export class HomeScreenConfiguratorPage extends SignalWatcher(LitElement) {
  static styles = [HomeScreenConfiguratorPageStyles, responsiveScreenStyles];

  private _onVisibilityChange(id: HomeScreenSectionId, event: CustomEvent<boolean>): void {
    setHomeScreenSectionVisible(id, event.detail);
  }

  render(): HTMLTemplateResult {
    const config = getAvailableHomeScreenConfig();

    return html`
      <div class="screen">
        <brew-top-bar
          title="Home Screen"
          .icon="${ARROW_BACK_ICON_SVG}"
          href="/more/settings"
        ></brew-top-bar>

        <div class="content">
          <p class="section-hint">
            Choose which cards show up on Home and reorder them with the up/down arrows. Hidden
            cards keep their settings - toggle one back on any time.
          </p>

          <div class="rows">
            ${config.map(
              (entry, index) => html`
                ${index > 0 ? html`<div class="divider"></div>` : null}
                <brew-home-screen-config-row
                  title="${HOME_SCREEN_SECTION_LABELS[entry.id].title}"
                  description="${HOME_SCREEN_SECTION_LABELS[entry.id].description}"
                  ?visible="${entry.visible}"
                  ?disable-move-up="${index === 0}"
                  ?disable-move-down="${index === config.length - 1}"
                  @visibility-change="${(e: CustomEvent<boolean>) =>
                    this._onVisibilityChange(entry.id, e)}"
                  @move-up-click="${() => moveHomeScreenSection(entry.id, "up")}"
                  @move-down-click="${() => moveHomeScreenSection(entry.id, "down")}"
                ></brew-home-screen-config-row>
              `,
            )}
          </div>

          <brew-button variant="outlined" @button-click="${resetHomeScreenConfig}"
            >Reset to default</brew-button
          >
        </div>

        <brew-bottom-nav active="more"></brew-bottom-nav>
      </div>
    `;
  }
}
