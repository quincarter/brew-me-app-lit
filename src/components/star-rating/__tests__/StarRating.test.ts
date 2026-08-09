import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../brew-star-rating";
import type { StarRating } from "../StarRating";

describe("brew-star-rating", () => {
  let element: StarRating;

  beforeEach(async () => {
    element = document.createElement("brew-star-rating") as StarRating;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when read-only and value is 0", () => {
    expect(element.shadowRoot?.querySelector(".stars")).toBeNull();
  });

  it("renders 5 read-only stars, none filled, when editable with value 0", async () => {
    element.editable = true;
    await element.updateComplete;

    const stars = element.shadowRoot?.querySelectorAll(".star");
    expect(stars?.length).toBe(5);
    expect(element.shadowRoot?.querySelectorAll(".star.filled").length).toBe(0);
  });

  it("renders 3 filled and 2 unfilled stars for value=3", async () => {
    element.value = 3;
    await element.updateComplete;

    const stars = element.shadowRoot?.querySelectorAll(".star");
    expect(stars?.length).toBe(5);
    expect(element.shadowRoot?.querySelectorAll(".star.filled").length).toBe(3);
    expect(stars?.length && element.shadowRoot?.querySelectorAll(".star:not(.filled)").length).toBe(
      2,
    );
  });

  it("renders 5 filled stars for value=5", async () => {
    element.value = 5;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelectorAll(".star.filled").length).toBe(5);
    expect(element.shadowRoot?.querySelectorAll(".star:not(.filled)").length).toBe(0);
  });

  it("renders no buttons in read-only mode when rated", async () => {
    element.value = 3;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelectorAll("button").length).toBe(0);
  });

  it("renders each star as a button in editable mode", async () => {
    element.editable = true;
    element.value = 3;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelectorAll("button.star").length).toBe(5);
  });

  it("dispatches rating-change with the clicked star's 1-based position", async () => {
    element.editable = true;
    await element.updateComplete;

    const buttons = element.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.star");
    const detailPromise = new Promise<number>((resolve) => {
      element.addEventListener("rating-change", (event) =>
        resolve((event as CustomEvent<number>).detail),
      );
    });

    buttons?.[2]?.click();

    expect(await detailPromise).toBe(3);
  });

  it("dispatches 0 when clicking the already-active topmost star again", async () => {
    element.editable = true;
    element.value = 3;
    await element.updateComplete;

    const buttons = element.shadowRoot?.querySelectorAll<HTMLButtonElement>("button.star");
    const detailPromise = new Promise<number>((resolve) => {
      element.addEventListener("rating-change", (event) =>
        resolve((event as CustomEvent<number>).detail),
      );
    });

    buttons?.[2]?.click();

    expect(await detailPromise).toBe(0);
  });

  it("dispatches a bubbling, composed rating-change event", async () => {
    element.editable = true;
    await element.updateComplete;

    const eventPromise = new Promise<CustomEvent<number>>((resolve) => {
      element.addEventListener("rating-change", (event) => resolve(event as CustomEvent<number>));
    });

    const button = element.shadowRoot?.querySelector<HTMLButtonElement>("button.star");
    button?.click();

    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
