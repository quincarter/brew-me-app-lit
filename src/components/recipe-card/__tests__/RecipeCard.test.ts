import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IAeropressRecipe } from "../../../shared/interfaces/brew.interface";
import "../brew-recipe-card";
import type { RecipeCard } from "../RecipeCard";

const recipe: IAeropressRecipe = {
  id: "test-recipe",
  year: 2021,
  place: 1,
  competitor: "Test Competitor",
  country: "Testland",
  setup: { Position: "Inverted", Dose: "18g" },
  steps: ["Pour 100g of water.", "At 30s, stir gently."],
  doseGrams: 18,
  totalWaterGrams: 270,
};

describe("brew-recipe-card", () => {
  let element: RecipeCard;

  beforeEach(async () => {
    element = document.createElement("brew-recipe-card") as RecipeCard;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders nothing when .recipe isn't set", () => {
    expect(element.shadowRoot?.querySelector(".card")).toBeNull();
  });

  it("renders collapsed by default when recipe is set", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
  });

  it("renders expanded when start-open is set", async () => {
    // startOpen only seeds the initial expanded state on connect, so it
    // must be set before the element is attached to the DOM.
    element.remove();
    element = document.createElement("brew-recipe-card") as RecipeCard;
    element.startOpen = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
  });

  it("toggles expanded state when the header is clicked", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();

    header.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(false);
    expect(element.shadowRoot?.querySelector(".body")).toBeNull();
  });

  it("dispatches brew-now with the recipe when 'Brew this recipe now' is clicked", async () => {
    element.recipe = recipe;
    await element.updateComplete;

    const header = element.shadowRoot?.querySelector("button.header") as HTMLButtonElement;
    header.click();
    await element.updateComplete;

    const brewButton = Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find(
      (button) => button.textContent?.replace(/\s+/g, " ").includes("Brew this recipe now"),
    );
    expect(brewButton).not.toBeUndefined();

    const innerButton = brewButton?.shadowRoot?.querySelector("button");
    if (!innerButton) throw new Error("expected the brew-button's inner button");

    const brewNowEvent = new Promise<CustomEvent<IAeropressRecipe>>((resolve) => {
      element.addEventListener("brew-now", (event) =>
        resolve(event as CustomEvent<IAeropressRecipe>),
      );
    });

    innerButton.click();

    const event = await brewNowEvent;
    expect(event.detail).toEqual(recipe);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
