import { StatTile } from "./StatTile";

if (!customElements.get("brew-stat-tile")) {
  customElements.define("brew-stat-tile", StatTile);
}
