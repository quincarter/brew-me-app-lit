import { RatioSummary } from "./RatioSummary";

if (!customElements.get("brew-ratio-summary")) {
  customElements.define("brew-ratio-summary", RatioSummary);
}
