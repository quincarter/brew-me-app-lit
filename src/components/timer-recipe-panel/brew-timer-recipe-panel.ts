import { TimerRecipePanel } from "./TimerRecipePanel";

if (!customElements.get("brew-timer-recipe-panel")) {
  customElements.define("brew-timer-recipe-panel", TimerRecipePanel);
}
