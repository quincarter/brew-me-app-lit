import { ActiveStepBanner } from "./ActiveStepBanner";

if (!customElements.get("brew-active-step-banner")) {
  customElements.define("brew-active-step-banner", ActiveStepBanner);
}
