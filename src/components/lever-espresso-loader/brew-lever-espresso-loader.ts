import { LeverEspressoLoader } from "./LeverEspressoLoader";

if (!customElements.get("brew-lever-espresso-loader")) {
  customElements.define("brew-lever-espresso-loader", LeverEspressoLoader);
}
