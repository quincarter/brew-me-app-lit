import { ThemeToggle } from "./ThemeToggle";

if (!customElements.get("brew-theme-toggle")) {
  customElements.define("brew-theme-toggle", ThemeToggle);
}
