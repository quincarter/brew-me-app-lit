import { EspressoRecipeCard } from "./EspressoRecipeCard";

if (!customElements.get("brew-espresso-recipe-card")) {
  customElements.define("brew-espresso-recipe-card", EspressoRecipeCard);
}
