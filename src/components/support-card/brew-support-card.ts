import { SupportCard } from "./SupportCard";

if (!customElements.get("brew-support-card")) {
  customElements.define("brew-support-card", SupportCard);
}
