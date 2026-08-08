import { SavedCard } from "./SavedCard";

if (!customElements.get("brew-saved-card")) {
  customElements.define("brew-saved-card", SavedCard);
}
