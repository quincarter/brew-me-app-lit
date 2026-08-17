import { ConnectionStatusPill } from "./ConnectionStatusPill";

if (!customElements.get("brew-connection-status-pill")) {
  customElements.define("brew-connection-status-pill", ConnectionStatusPill);
}
