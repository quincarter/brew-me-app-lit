import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import type { IAeropressRecipe } from "../../../shared/interfaces/brew.interface";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  closePostSaveSheet,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import "../aeropress-recipes-page";
import type { AeropressRecipesPage } from "../aeropress-recipes-page";

describe("aeropress-recipes-page", () => {
  let element: AeropressRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();

    element = document.createElement("aeropress-recipes-page") as AeropressRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
    deleteAllSavedBrews();
  });

  it("renders every AEROPRESS_RECIPES entry as a brew-recipe-card", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-recipe-card");
    expect(cards).toHaveLength(AEROPRESS_RECIPES.length);
  });

  it("saves a new brew and opens the post-save sheet when a card dispatches brew-now", async () => {
    const targetRecipe = AEROPRESS_RECIPES[0];
    const card = element.shadowRoot?.querySelector("brew-recipe-card");
    expect(card).not.toBeNull();

    expect(savedBrewsSignal.value).toHaveLength(0);

    card?.dispatchEvent(
      new CustomEvent<IAeropressRecipe>("brew-now", {
        detail: targetRecipe,
        bubbles: true,
        composed: true,
      }),
    );
    await element.updateComplete;

    expect(savedBrewsSignal.value).toHaveLength(1);
    const saved = savedBrewsSignal.value[0];
    expect(saved.brewType).toBe("Aeropress");
    expect(saved.name).toBe(`${targetRecipe.competitor} · ${targetRecipe.year}`);

    expect(postSaveSheetOpenSignal.value).toBe(true);
    expect(postSaveSheetBrewSignal.value).toEqual(saved);
  });
});
