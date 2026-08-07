import { IconButton } from "./IconButton";

if (!customElements.get("brew-icon-button")) {
  customElements.define("brew-icon-button", IconButton);
}
