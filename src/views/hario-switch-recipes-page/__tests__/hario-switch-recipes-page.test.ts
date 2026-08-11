import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HARIO_SWITCH_RECIPES } from "../../../shared/data/hario-switch-recipes.data";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import "../hario-switch-recipes-page";
import type { HarioSwitchRecipesPage } from "../hario-switch-recipes-page";

describe("hario-switch-recipes-page", () => {
  let element: HarioSwitchRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();
    element = document.createElement("hario-switch-recipes-page") as HarioSwitchRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    deleteAllSavedBrews();
  });

  it("renders all 7 Hario Switch recipes", () => {
    const cards = element.shadowRoot?.querySelectorAll("brew-pourover-recipe-card");
    expect(cards).toHaveLength(HARIO_SWITCH_RECIPES.length);
  });

  it("renders the interchangeability callout note", () => {
    const callout = element.shadowRoot?.querySelector(".recipe-callout");
    expect(callout).not.toBeNull();
    expect(callout?.textContent).toContain("interchangeably");
  });

  it("saves a Hario Switch recipe and opens post-save sheet when Brew now is clicked", async () => {
    const firstCard = element.shadowRoot?.querySelector("brew-pourover-recipe-card");
    expect(firstCard).not.toBeNull();

    firstCard?.dispatchEvent(
      new CustomEvent("brew-now", {
        detail: HARIO_SWITCH_RECIPES[0],
        bubbles: true,
        composed: true,
      }),
    );

    expect(savedBrewsSignal.value).toHaveLength(1);
    expect(savedBrewsSignal.value[0].brewType).toBe("Hario Switch");
    expect(savedBrewsSignal.value[0].name).toBe("Official Hario · Hario Switch Hybrid");
  });
});
