import { ActionTile } from "./ActionTile";

if (!customElements.get("brew-action-tile")) {
  customElements.define("brew-action-tile", ActionTile);
}
