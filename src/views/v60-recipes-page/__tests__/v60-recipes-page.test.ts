import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { V60_RECIPES } from "../../../shared/data/v60-recipes.data";
import type { IV60Recipe } from "../../../shared/interfaces/brew.interface";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  closePostSaveSheet,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import "../v60-recipes-page";
import type { V60RecipesPage } from "../v60-recipes-page";

describe("v60-recipes-page", () => {
  let element: V60RecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();

    element = document.createElement("v60-recipes-page") as V60RecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
    deleteAllSavedBrews();
  });

  it("renders a recipe card for each entry in V60_RECIPES", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(V60_RECIPES.length);
  });

  it("saves a new brew and opens the post-save sheet when a card dispatches brew-now", async () => {
    const targetRecipe = V60_RECIPES[0];
    const card = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(card).not.toBeNull();

    expect(savedBrewsSignal.value).toHaveLength(0);

    card?.dispatchEvent(
      new CustomEvent<IV60Recipe>("brew-now", {
        detail: targetRecipe,
        bubbles: true,
        composed: true,
      }),
    );
    await element.updateComplete;

    expect(savedBrewsSignal.value).toHaveLength(1);
    const saved = savedBrewsSignal.value[0];
    expect(saved.brewType).toBe("V60");
    expect(saved.name).toBe(`${targetRecipe.author} · ${targetRecipe.title}`);

    expect(postSaveSheetOpenSignal.value).toBe(true);
    expect(postSaveSheetBrewSignal.value).toEqual(saved);
  });
});
