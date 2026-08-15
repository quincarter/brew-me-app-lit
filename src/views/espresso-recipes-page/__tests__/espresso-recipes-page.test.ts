import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ESPRESSO_PROFILES } from "../../../shared/data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../../shared/data/espresso-shot-styles.data";
import type { IEspressoProfile, IEspressoShotStyle } from "../../../shared/interfaces/brew.interface";
import { deleteAllSavedBrews, savedBrewsSignal } from "../../../shared/stores/brew.store";
import {
  closePostSaveSheet,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../../../shared/stores/post-save-sheet.store";
import "../espresso-recipes-page";
import type { EspressoRecipesPage } from "../espresso-recipes-page";

describe("espresso-recipes-page", () => {
  let element: EspressoRecipesPage;

  beforeEach(async () => {
    deleteAllSavedBrews();

    element = document.createElement("espresso-recipes-page") as EspressoRecipesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
    deleteAllSavedBrews();
  });

  it("renders a section header and a recipe card for each entry in ESPRESSO_SHOT_STYLES", () => {
    const headers = element.shadowRoot?.querySelectorAll(".section-header");
    expect(headers?.[0]?.textContent).toBe("Standard recipes");

    const lists = element.shadowRoot?.querySelectorAll(".recipe-list");
    const styleCards = lists?.[0]?.querySelectorAll("brew-espresso-recipe-card");
    expect(styleCards).toHaveLength(ESPRESSO_SHOT_STYLES.length);
    expect((styleCards?.[0] as HTMLElement & { recipe: IEspressoShotStyle })?.recipe).toEqual(
      ESPRESSO_SHOT_STYLES[0],
    );
  });

  it("renders a section header and a recipe card for each entry in ESPRESSO_PROFILES", () => {
    const headers = element.shadowRoot?.querySelectorAll(".section-header");
    expect(headers?.[1]?.textContent).toBe("Shot profiles");

    const lists = element.shadowRoot?.querySelectorAll(".recipe-list");
    const profileCards = lists?.[1]?.querySelectorAll("brew-espresso-recipe-card");
    expect(profileCards).toHaveLength(ESPRESSO_PROFILES.length);
    expect((profileCards?.[0] as HTMLElement & { recipe: IEspressoProfile })?.recipe).toEqual(
      ESPRESSO_PROFILES[0],
    );
  });

  it("saves a new brew and opens the post-save sheet when a shot style card dispatches brew-now", async () => {
    const targetStyle = ESPRESSO_SHOT_STYLES[0];
    const lists = element.shadowRoot?.querySelectorAll(".recipe-list");
    const card = lists?.[0]?.querySelector("brew-espresso-recipe-card");
    expect(card).toBeDefined();

    expect(savedBrewsSignal.value).toHaveLength(0);

    card?.dispatchEvent(
      new CustomEvent<IEspressoShotStyle>("brew-now", {
        detail: targetStyle,
        bubbles: true,
        composed: true,
      }),
    );
    await element.updateComplete;

    expect(savedBrewsSignal.value).toHaveLength(1);
    const saved = savedBrewsSignal.value[0];
    expect(saved.brewType).toBe("Espresso Shot");
    expect(saved.name).toBe(targetStyle.label);
    expect(saved.ratio).toBe(targetStyle.ratio);
    expect(saved.water).toBe(targetStyle.doseOut);
    expect(saved.coffee).toBe(targetStyle.doseIn);

    expect(postSaveSheetOpenSignal.value).toBe(true);
    expect(postSaveSheetBrewSignal.value).toEqual(saved);
  });

  it("saves a new brew and opens the post-save sheet when a profile card dispatches brew-now", async () => {
    const targetProfile = ESPRESSO_PROFILES[0];
    const lists = element.shadowRoot?.querySelectorAll(".recipe-list");
    const card = lists?.[1]?.querySelector("brew-espresso-recipe-card");
    expect(card).toBeDefined();

    expect(savedBrewsSignal.value).toHaveLength(0);

    card?.dispatchEvent(
      new CustomEvent<IEspressoProfile>("brew-now", {
        detail: targetProfile,
        bubbles: true,
        composed: true,
      }),
    );
    await element.updateComplete;

    expect(savedBrewsSignal.value).toHaveLength(1);
    const saved = savedBrewsSignal.value[0];
    expect(saved.brewType).toBe("Espresso Shot");
    expect(saved.name).toBe(targetProfile.name);
    expect(saved.ratio).toBe(targetProfile.ratio);
    expect(saved.water).toBe(targetProfile.doseOut);
    expect(saved.coffee).toBe(targetProfile.doseIn);

    expect(postSaveSheetOpenSignal.value).toBe(true);
    expect(postSaveSheetBrewSignal.value).toEqual(saved);
  });
});
