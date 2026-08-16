import { ShotList } from "./ShotList";

if (!customElements.get("brew-shot-list")) {
  customElements.define("brew-shot-list", ShotList);
}
