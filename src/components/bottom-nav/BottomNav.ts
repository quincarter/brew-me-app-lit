import { type HTMLTemplateResult, html, LitElement, SVGTemplateResult } from "lit";
import { property } from "lit/decorators.js";
import "../icon/brew-icon";
import { BottomNavStyles } from "./bottom-nav.styles";
import {
  CALCULATE_ICON_SVG,
  HOME_ICON_SVG,
  MORE_ICON_SVG,
  SAVED_ICON_SVG,
} from "../../shared/icons/icons";

export type BottomNavTab = "home" | "calculate" | "saved" | "more" | "";

interface NavTabConfig {
  id: BottomNavTab;
  href: string;
  icon: SVGTemplateResult;
  label: string;
}

const TABS: NavTabConfig[] = [
  { id: "home", href: "/", icon: HOME_ICON_SVG, label: "Home" },
  {
    id: "calculate",
    href: "/calculate",
    icon: CALCULATE_ICON_SVG,
    label: "Calculate",
  },
  { id: "saved", href: "/saved", icon: SAVED_ICON_SVG, label: "Saved" },
  { id: "more", href: "/more", icon: MORE_ICON_SVG, label: "More" },
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
                <brew-icon .svg="${tab.icon}"></brew-icon>
              </span>
              <span class="label ${isActive ? "active" : ""}">${tab.label}</span>
            </a>
          `;
        })}
      </nav>
    `;
  }
}
