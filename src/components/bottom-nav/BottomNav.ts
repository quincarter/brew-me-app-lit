import { type HTMLTemplateResult, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { BottomNavStyles } from "./bottom-nav.styles";

export type BottomNavTab = "home" | "calculate" | "saved" | "more" | "";

interface NavTabConfig {
  id: BottomNavTab;
  href: string;
  icon: string;
  label: string;
}

const TABS: NavTabConfig[] = [
  { id: "home", href: "/", icon: "home", label: "Home" },
  { id: "calculate", href: "/calculate", icon: "calculate", label: "Calculate" },
  { id: "saved", href: "/saved", icon: "bookmark", label: "Saved" },
  { id: "more", href: "/more", icon: "more_horiz", label: "More" },
];

/**
 * # Bottom Nav
 * The persistent 4-tab navigation bar shown at the bottom of every BrewMe
 * screen. The current section is highlighted with a pill background,
 * mirroring the source design.
 * ## Usage
 * ```html
 * <brew-bottom-nav active="home"></brew-bottom-nav>
 * ```
 * @element brew-bottom-nav
 */
export class BottomNav extends LitElement {
  static styles = [BottomNavStyles];

  /** Which tab is highlighted. Leave empty if a screen doesn't map to any of the 4 tabs. */
  @property({ type: String }) active: BottomNavTab = "";

  render(): HTMLTemplateResult {
    return html`
      <nav class="nav">
        ${TABS.map((tab) => {
          const isActive = tab.id === this.active;
          return html`
            <a class="tab" href="${tab.href}">
              <span class="icon-wrap ${isActive ? "active" : ""}">
                <brew-icon name="${tab.icon}"></brew-icon>
              </span>
              <span class="label ${isActive ? "active" : ""}">${tab.label}</span>
            </a>
          `;
        })}
      </nav>
    `;
  }
}
