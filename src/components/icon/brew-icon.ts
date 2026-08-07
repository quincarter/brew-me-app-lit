import { Icon } from "./Icon";

if (!customElements.get("brew-icon")) {
  customElements.define("brew-icon", Icon);
}
