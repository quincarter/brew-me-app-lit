import { Switch } from "./Switch";

if (!customElements.get("brew-switch")) {
  customElements.define("brew-switch", Switch);
}
