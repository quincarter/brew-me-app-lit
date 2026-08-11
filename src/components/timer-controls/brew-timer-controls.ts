import { TimerControls } from "./TimerControls";

if (!customElements.get("brew-timer-controls")) {
  customElements.define("brew-timer-controls", TimerControls);
}
