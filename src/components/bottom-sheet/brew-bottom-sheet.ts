import { BottomSheet } from "./BottomSheet";

if (!customElements.get("brew-bottom-sheet")) {
  customElements.define("brew-bottom-sheet", BottomSheet);
}
