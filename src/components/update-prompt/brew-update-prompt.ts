import { UpdatePrompt } from "./UpdatePrompt";

if (!customElements.get("brew-update-prompt")) {
  customElements.define("brew-update-prompt", UpdatePrompt);
}
