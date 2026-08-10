import { TourOverlay } from "./TourOverlay";

if (!customElements.get("brew-tour-overlay")) {
  customElements.define("brew-tour-overlay", TourOverlay);
}
