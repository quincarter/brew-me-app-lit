import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KALITA_WAVE_RECIPES } from "../../../shared/data/kalita-wave-recipes.data";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import "../kalita-wave-recipes-page";
import type { KalitaWaveRecipesPage } from "../kalita-wave-recipes-page";

describe("kalita-wave-recipes-page", () => {
  let element: KalitaWaveRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();
    element = document.createElement("kalita-wave-recipes-page") as KalitaWaveRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deleteAllSavedBrews();
  });

  it("renders all 15 Kalita Wave recipes", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(KALITA_WAVE_RECIPES.length);
  });

  it("saves a Kalita Wave recipe and opens post-save sheet when Brew now is clicked", async () => {
    const firstCard = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(firstCard).not.toBeNull();

    firstCard?.dispatchEvent(
      new CustomEvent("brew-now", {
        detail: KALITA_WAVE_RECIPES[0],
        bubbles: true,
        composed: true,
      }),
    );

    expect(savedBrewsSignal.value).toHaveLength(1);
    expect(savedBrewsSignal.value[0].brewType).toBe("Kalita Wave");
    expect(savedBrewsSignal.value[0].name).toBe("James McCarthy · WBrC 2013 Champion Recipe");
  });
});
