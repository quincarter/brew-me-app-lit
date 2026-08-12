import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IV60Recipe } from "../../../shared/interfaces/brew.interface";
import "../brew-pourover-recipe-card";
import type { PourOverRecipeCard } from "../PourOverRecipeCard";

const recipe: IV60Recipe = {
  id: "test-v60-recipe",
  title: "Test V60 Recipe",
  author: "Test Author",
  setup: { Dripper: "V60 02", Dose: "15g" },
  steps: ["Bloom 45s.", "Pour to 250g."],
};

describe("brew-pourover-recipe-card", () => {
  let element: PourOverRecipeCard;

  beforeEach(async () => {
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
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
    element.remove();
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
    element.startOpen = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".card")?.classList.contains("expanded")).toBe(true);
    expect(element.shadowRoot?.querySelector(".body")).not.toBeNull();
  });

  it("omits the brew button when hide-brew-button is set", async () => {
    element.remove();
    element = document.createElement("brew-pourover-recipe-card") as PourOverRecipeCard;
    element.startOpen = true;
    element.hideBrewButton = true;
    element.recipe = recipe;
    document.body.appendChild(element);
    await element.updateComplete;

    const brewButton = element.shadowRoot?.querySelector("brew-button");
    expect(brewButton).toBeNull();
  });
});
