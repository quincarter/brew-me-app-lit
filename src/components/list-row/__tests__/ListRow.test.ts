import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-list-row";
import type { ListRow } from "../ListRow";

describe("brew-list-row", () => {
  let element: ListRow;

  beforeEach(async () => {
    element = document.createElement("brew-list-row") as ListRow;
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
    element.rating = 4;
    await element.updateComplete;

    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("4");
    expect(starRating?.getAttribute("size")).toBe("14");
  });
});
