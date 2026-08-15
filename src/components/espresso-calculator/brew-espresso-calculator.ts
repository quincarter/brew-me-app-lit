import { EspressoCalculator } from "./EspressoCalculator";

if (!customElements.get("brew-espresso-calculator")) {
  customElements.define("brew-espresso-calculator", EspressoCalculator);
}
