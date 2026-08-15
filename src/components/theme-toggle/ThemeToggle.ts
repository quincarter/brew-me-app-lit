import { SignalWatcher } from "@lit-labs/preact-signals";
import { type HTMLTemplateResult, html, LitElement } from "lit";
import { isDarkThemeSignal, toggleDarkTheme } from "../../shared/stores/theme.store";
import "../icon/brew-icon";
import { ThemeToggleStyles } from "./theme-toggle.styles";
import { LIGHT_MODE_ICON_SVG, DARK_MODE_ICON_SVG } from "../../shared/icons/icons";

/**
 * # Theme Toggle
 * A small floating light/dark toggle, adapted from app-shell-starter's
 * `ThemeSwitcher`. Drives the shared `theme.store.ts`, which sets
 * `data-theme` on `<html>` and persists the choice to `localStorage` so
 * `detect-color-scheme.js` can apply it before paint on the next load - the
 * Settings screen's dark-mode switch reads/writes the same store, so the two
 * always agree.
 * @element brew-theme-toggle
 */
export class ThemeToggle extends SignalWatcher(LitElement) {
  static styles = [ThemeToggleStyles];

  render(): HTMLTemplateResult {
    const isDark = isDarkThemeSignal.value;
    return html`
      <button type="button" aria-label="Toggle dark mode" @click="${toggleDarkTheme}">
        <brew-icon
          .svg="${isDark ? LIGHT_MODE_ICON_SVG : DARK_MODE_ICON_SVG}"
          size="20"
        ></brew-icon>
      </button>
    `;
  }
}
