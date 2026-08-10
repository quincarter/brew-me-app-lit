import { BrewStepsCard } from "./BrewStepsCard";

if (!customElements.get("brew-steps-card")) {
  customElements.define("brew-steps-card", BrewStepsCard);
}
