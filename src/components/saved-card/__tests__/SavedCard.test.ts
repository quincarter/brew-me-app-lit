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

  it("renders a compact brew-star-rating even when rating is 0, for card-height alignment", () => {
    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("0");
    expect(starRating?.getAttribute("size")).toBe("14");
  });

  it("renders a compact brew-star-rating when rating is set", async () => {
    element.rating = 5;
    await element.updateComplete;

    const starRating = element.shadowRoot?.querySelector("brew-star-rating");
    expect(starRating).not.toBeNull();
    expect(starRating?.getAttribute("value")).toBe("5");
    expect(starRating?.getAttribute("size")).toBe("14");
  });

  it("does not render a replay button when replayable is false", () => {
    expect(element.shadowRoot?.querySelector("brew-icon-button")).toBeNull();
  });

  it("renders a replay button when replayable is true", async () => {
    element.replayable = true;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector("brew-icon-button")).not.toBeNull();
  });

  it("dispatches replay-click without triggering the card's own navigation on replay click", async () => {
    element.href = "/saved/1";
    element.replayable = true;
    await element.updateComplete;

    const replayButton = element.shadowRoot?.querySelector("brew-icon-button");
    const anchor = element.shadowRoot?.querySelector("a.card");
    expect(replayButton).not.toBeNull();

    let replayClickFired = false;
    element.addEventListener("replay-click", () => {
      replayClickFired = true;
    });
    let anchorClickReceived = false;
    anchor?.addEventListener("click", () => {
      anchorClickReceived = true;
    });

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    replayButton?.dispatchEvent(clickEvent);

    expect(replayClickFired).toBe(true);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(anchorClickReceived).toBe(false);
  });
});
