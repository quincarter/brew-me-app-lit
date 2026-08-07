import { type HTMLTemplateResult, html, LitElement, type PropertyValues } from "lit";
import "../icon/brew-icon";
import { ThemeToggleStyles } from "./theme-toggle.styles";

/**
 * # Theme Toggle
 * A small floating light/dark toggle, adapted from app-shell-starter's
 * `ThemeSwitcher`: it sets `data-theme` on `<html>` and persists the choice
 * to `localStorage` so `detect-color-scheme.js` can apply it before paint on
 * the next load.
 * @element brew-theme-toggle
 */
export class ThemeToggle extends LitElement {
  static styles = [ThemeToggleStyles];

  private _isDark = false;

  protected firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this._isDark = document.documentElement.getAttribute("data-theme") === "dark";
    this.requestUpdate();
  }

  private _toggle = (): void => {
    this._isDark = !this._isDark;
    if (this._isDark) {
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.removeAttribute("data-theme");
    }
    this.requestUpdate();
  };

  render(): HTMLTemplateResult {
    return html`
      <button type="button" aria-label="Toggle dark mode" @click="${this._toggle}">
        <brew-icon name="${this._isDark ? "light_mode" : "dark_mode"}" size="20"></brew-icon>
      </button>
    `;
  }
}
