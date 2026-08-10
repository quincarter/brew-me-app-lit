import { PostSaveSheet } from "./PostSaveSheet";

if (!customElements.get("brew-post-save-sheet")) {
  customElements.define("brew-post-save-sheet", PostSaveSheet);
}
