import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_OTHER_RECIPES } from "../../../shared/data/aeropress-other-recipes.data";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import type {
  IAeropressExpertRecipe,
  IAeropressRecipe,
} from "../../../shared/interfaces/brew.interface";
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

  describe("Other recipes tab", () => {
    const chip = (label: string): Element | undefined =>
      Array.from(element.shadowRoot?.querySelectorAll("brew-chip") ?? []).find(
        (el) => el.getAttribute("label") === label,
      );

    const clickChip = (label: string): void => {
      chip(label)?.shadowRoot?.querySelector("button")?.click();
    };

    it("hides the WAC cards and shows one brew-pourover-recipe-card per AEROPRESS_OTHER_RECIPES entry when Other is selected", async () => {
      clickChip("Other");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelectorAll("brew-recipe-card")).toHaveLength(0);
      expect(element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card")).toHaveLength(
        AEROPRESS_OTHER_RECIPES.length,
      );
    });

    it("switches back to the WAC cards when a year/All chip is reselected", async () => {
      clickChip("Other");
      await element.updateComplete;
      clickChip("All");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelectorAll("brew-recipe-card")).toHaveLength(
        AEROPRESS_RECIPES.length,
      );
      expect(element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card")).toHaveLength(0);
    });

    it("saves a new brew and opens the post-save sheet when an Other card dispatches brew-now", async () => {
      clickChip("Other");
      await element.updateComplete;

      const targetRecipe = AEROPRESS_OTHER_RECIPES[0];
      const card = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
      expect(card).not.toBeNull();

      expect(savedBrewsSignal.value).toHaveLength(0);

      card?.dispatchEvent(
        new CustomEvent<IAeropressExpertRecipe>("brew-now", {
          detail: targetRecipe,
          bubbles: true,
          composed: true,
        }),
      );
      await element.updateComplete;

      expect(savedBrewsSignal.value).toHaveLength(1);
      const saved = savedBrewsSignal.value[0];
      expect(saved.brewType).toBe("Aeropress");
      expect(saved.name).toBe(`${targetRecipe.author} · ${targetRecipe.title}`);

      expect(postSaveSheetOpenSignal.value).toBe(true);
      expect(postSaveSheetBrewSignal.value).toEqual(saved);
    });
  });
});
