import { VideoCard } from "./VideoCard";

if (!customElements.get("brew-video-card")) {
  customElements.define("brew-video-card", VideoCard);
}
