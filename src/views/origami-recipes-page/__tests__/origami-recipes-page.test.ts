import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ORIGAMI_RECIPES } from "../../../shared/data/origami-recipes.data";
import type { IOrigamiRecipe } from "../../../shared/interfaces/brew.interface";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  closePostSaveSheet,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import "../origami-recipes-page";
import type { OrigamiRecipesPage } from "../origami-recipes-page";

describe("origami-recipes-page", () => {
  let element: OrigamiRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();

    element = document.createElement("origami-recipes-page") as OrigamiRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
    deleteAllSavedBrews();
  });

  it("renders top bar with Origami Recipes title", () => {
    const topBar = element.shadowRoot?.querySelector("brew-top-bar");
    expect(topBar).not.toBeNull();
    expect(topBar?.getAttribute("title")).toBe("Origami Recipes");
  });

  it("renders a recipe card for each entry in ORIGAMI_RECIPES", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(ORIGAMI_RECIPES.length);
  });

  it("saves a new brew and opens the post-save sheet when a card dispatches brew-now", async () => {
    const targetRecipe = ORIGAMI_RECIPES[0];
    const card = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(card).not.toBeNull();

    expect(savedBrewsSignal.value).toHaveLength(0);

    card?.dispatchEvent(
      new CustomEvent<IOrigamiRecipe>("brew-now", {
        detail: targetRecipe,
        bubbles: true,
        composed: true,
      }),
    );
    await element.updateComplete;

    expect(savedBrewsSignal.value).toHaveLength(1);
    const saved = savedBrewsSignal.value[0];
    expect(saved.brewType).toBe("Origami");
    expect(saved.name).toBe(`${targetRecipe.author} · ${targetRecipe.title}`);

    expect(postSaveSheetOpenSignal.value).toBe(true);
    expect(postSaveSheetBrewSignal.value).toEqual(saved);
  });
});
