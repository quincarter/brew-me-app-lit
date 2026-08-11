import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CLEVER_DRIPPER_RECIPES } from "../../../shared/data/clever-dripper-recipes.data";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import "../clever-dripper-recipes-page";
import type { CleverDripperRecipesPage } from "../clever-dripper-recipes-page";

describe("clever-dripper-recipes-page", () => {
  let element: CleverDripperRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();
    element = document.createElement("clever-dripper-recipes-page") as CleverDripperRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deleteAllSavedBrews();
  });

  it("renders all Clever Dripper recipes", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(CLEVER_DRIPPER_RECIPES.length);
  });

  it("saves a Clever Dripper recipe and opens post-save sheet when Brew now is clicked", async () => {
    const firstCard = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(firstCard).not.toBeNull();

    firstCard?.dispatchEvent(
      new CustomEvent("brew-now", {
        detail: CLEVER_DRIPPER_RECIPES[0],
        bubbles: true,
        composed: true,
      }),
    );

    expect(savedBrewsSignal.value).toHaveLength(1);
    expect(savedBrewsSignal.value[0].brewType).toBe("Clever Dripper");
    expect(savedBrewsSignal.value[0].name).toBe("Morgan Eckroth · Morgan Eckroth Clever");
  });
});
