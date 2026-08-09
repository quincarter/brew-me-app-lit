import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-saved-card";
import type { SavedCard } from "../SavedCard";

describe("brew-saved-card", () => {
  let element: SavedCard;

  beforeEach(async () => {
    element = document.createElement("brew-saved-card") as SavedCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("does not render brew-star-rating when rating is 0", () => {
    expect(element.shadowRoot?.querySelector("brew-star-rating")).toBeNull();
  });

  it("renders a compact brew-star-rating when rating is set", async () => {
    element.rating = 5;
    await element.updateComplete;

    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("5");
    expect(starRating?.getAttribute("size")).toBe("14");
  });
});
