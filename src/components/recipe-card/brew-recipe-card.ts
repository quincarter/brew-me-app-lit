import { RecipeCard } from "./RecipeCard";

if (!customElements.get("brew-recipe-card")) {
  customElements.define("brew-recipe-card", RecipeCard);
}
