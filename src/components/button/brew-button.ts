import { Button } from "./Button";

if (!customElements.get("brew-button")) {
  customElements.define("brew-button", Button);
}
