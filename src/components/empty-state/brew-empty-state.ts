import { EmptyState } from "./EmptyState";

if (!customElements.get("brew-empty-state")) {
  customElements.define("brew-empty-state", EmptyState);
}
