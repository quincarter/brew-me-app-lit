import { AeropressLoader } from "./AeropressLoader";

if (!customElements.get("brew-aeropress-loader")) {
  customElements.define("brew-aeropress-loader", AeropressLoader);
}
