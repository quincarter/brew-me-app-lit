import { RatioForm } from "./RatioForm";

if (!customElements.get("brew-ratio-form")) {
  customElements.define("brew-ratio-form", RatioForm);
}
