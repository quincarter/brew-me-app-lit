import { VideoSearch } from "./VideoSearch";

if (!customElements.get("brew-video-search")) {
  customElements.define("brew-video-search", VideoSearch);
}
