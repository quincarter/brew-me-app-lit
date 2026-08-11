import { TimerDial } from "./TimerDial";

if (!customElements.get("brew-timer-dial")) {
  customElements.define("brew-timer-dial", TimerDial);
}
