import { Avatar } from "./Avatar";

if (!customElements.get("brew-avatar")) {
  customElements.define("brew-avatar", Avatar);
}
