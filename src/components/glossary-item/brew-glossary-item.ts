import { GlossaryItem } from "./GlossaryItem";

if (!customElements.get("brew-glossary-item")) {
  customElements.define("brew-glossary-item", GlossaryItem);
}
