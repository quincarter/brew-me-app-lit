import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CHEMEX_RECIPES } from "../../../shared/data/chemex-recipes.data";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import "../chemex-recipes-page";
import type { ChemexRecipesPage } from "../chemex-recipes-page";

describe("chemex-recipes-page", () => {
  let element: ChemexRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();
    element = document.createElement("chemex-recipes-page") as ChemexRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deleteAllSavedBrews();
  });

  it("renders all Chemex recipes", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(CHEMEX_RECIPES.length);
  });

  it("saves a Chemex recipe and opens post-save sheet when Brew now is clicked", async () => {
    const firstCard = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(firstCard).not.toBeNull();

    firstCard?.dispatchEvent(
      new CustomEvent("brew-now", {
        detail: CHEMEX_RECIPES[0],
        bubbles: true,
        composed: true,
      }),
    );

    expect(savedBrewsSignal.value).toHaveLength(1);
    expect(savedBrewsSignal.value[0].brewType).toBe("Chemex");
    expect(savedBrewsSignal.value[0].name).toBe("Official Chemex · Chemex Classic Method");
  });
});
