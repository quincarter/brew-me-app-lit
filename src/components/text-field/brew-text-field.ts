import { TextField } from "./TextField";

if (!customElements.get("brew-text-field")) {
  customElements.define("brew-text-field", TextField);
}
