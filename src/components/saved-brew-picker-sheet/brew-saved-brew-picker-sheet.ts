import { SavedBrewPickerSheet } from "./SavedBrewPickerSheet";

if (!customElements.get("brew-saved-brew-picker-sheet")) {
  customElements.define("brew-saved-brew-picker-sheet", SavedBrewPickerSheet);
}
