import { ProductLinkCard } from "./ProductLinkCard";

if (!customElements.get("brew-product-link-card")) {
  customElements.define("brew-product-link-card", ProductLinkCard);
}
