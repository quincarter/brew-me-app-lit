import { PourOverRecipeCard } from "./PourOverRecipeCard";

if (!customElements.get("brew-pourover-recipe-card")) {
  customElements.define("brew-pourover-recipe-card", PourOverRecipeCard);
}
