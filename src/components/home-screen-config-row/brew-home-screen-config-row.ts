import { HomeScreenConfigRow } from "./HomeScreenConfigRow";

if (!customElements.get("brew-home-screen-config-row")) {
  customElements.define("brew-home-screen-config-row", HomeScreenConfigRow);
}
