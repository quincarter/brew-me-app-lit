import { RecipePickerSheet } from "./RecipePickerSheet";

if (!customElements.get("brew-recipe-picker-sheet")) {
  customElements.define("brew-recipe-picker-sheet", RecipePickerSheet);
}
