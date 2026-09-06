import { ChemexLoader } from "./ChemexLoader";

if (!customElements.get("brew-chemex-loader")) {
  customElements.define("brew-chemex-loader", ChemexLoader);
}
