import { CollapsibleBanner } from "./CollapsibleBanner";

if (!customElements.get("brew-collapsible-banner")) {
  customElements.define("brew-collapsible-banner", CollapsibleBanner);
}
