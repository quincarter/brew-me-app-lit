import { TopBar } from "./TopBar";

if (!customElements.get("brew-top-bar")) {
  customElements.define("brew-top-bar", TopBar);
}
