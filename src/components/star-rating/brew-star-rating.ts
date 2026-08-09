import { StarRating } from "./StarRating";

if (!customElements.get("brew-star-rating")) {
  customElements.define("brew-star-rating", StarRating);
}
