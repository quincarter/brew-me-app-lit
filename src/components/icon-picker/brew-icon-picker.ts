import { IconPicker } from "./IconPicker";

if (!customElements.get("brew-icon-picker")) {
  customElements.define("brew-icon-picker", IconPicker);
}
