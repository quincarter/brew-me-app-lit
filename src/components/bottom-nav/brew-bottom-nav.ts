import { BottomNav } from "./BottomNav";

if (!customElements.get("brew-bottom-nav")) {
  customElements.define("brew-bottom-nav", BottomNav);
}
