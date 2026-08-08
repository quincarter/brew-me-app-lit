import { LinkCard } from "./LinkCard";

if (!customElements.get("brew-link-card")) {
  customElements.define("brew-link-card", LinkCard);
}
