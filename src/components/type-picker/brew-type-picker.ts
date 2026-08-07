import { TypePicker } from "./TypePicker";

if (!customElements.get("brew-type-picker")) {
  customElements.define("brew-type-picker", TypePicker);
}
