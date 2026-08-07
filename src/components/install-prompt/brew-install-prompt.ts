import { InstallPrompt } from "./InstallPrompt";

if (!customElements.get("brew-install-prompt")) {
  customElements.define("brew-install-prompt", InstallPrompt);
}
