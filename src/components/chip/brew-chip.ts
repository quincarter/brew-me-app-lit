import { Chip } from "./Chip";

if (!customElements.get("brew-chip")) {
  customElements.define("brew-chip", Chip);
}
