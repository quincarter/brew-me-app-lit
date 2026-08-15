import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ESPRESSO_PROFILES } from "../../data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../data/espresso-shot-styles.data";
import type { IAeropressRecipe, IShareableBrew } from "../../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../../utilities/aeropress-recipe.utility";
import {
  ESPRESSO_STYLE_DEFAULT_GRIND,
  ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
  ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
  buildEspressoSteps,
} from "../../utilities/espresso-recipe.utility";
import { gramsToOunces } from "../../utilities/ratio.utility";
import {
  addSavedBrew,
  brewAeropressRecipeNow,
  brewAgain,
  brewEspressoRecipeNow,
  deleteAllSavedBrews,
  markBrewedNow,
  mostRecentlyBrewedSignal,
  recentSavedBrewsSignal,
  savedBrewsSignal,
} from "../brew.store";
import {
  closePostSaveSheet,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../post-save-sheet.store";

const brew = (overrides: Partial<IShareableBrew> = {}): IShareableBrew => ({
  brewType: "Pour-over",
  ratio: 16,
  water: 480,
  coffee: 30,
  oz: 16.93,
  ...overrides,
});

const aeropressRecipe = (overrides: Partial<IAeropressRecipe> = {}): IAeropressRecipe => ({
  id: "test-recipe",
  year: 2021,
  place: 1,
  competitor: "Test Competitor",
  country: "Testland",
  setup: { Position: "Inverted", Dose: "18g" },
  steps: ["Pour 100g of water.", "At 30s, stir gently."],
  doseGrams: 18,
  totalWaterGrams: 270,
  ...overrides,
});

describe("brew.store", () => {
  beforeEach(() => {
    deleteAllSavedBrews();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
  });

  describe("markBrewedNow", () => {
    it("stamps lastBrewedAt on the matching brew and leaves others untouched", () => {
      const first = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const second = addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(first.id);

      const updatedFirst = savedBrewsSignal.value.find((b) => b.id === first.id);
      const updatedSecond = savedBrewsSignal.value.find((b) => b.id === second.id);

      expect(updatedFirst?.lastBrewedAt).toBe(Date.now());
      expect(updatedSecond?.lastBrewedAt).toBeUndefined();
    });
  });

  describe("mostRecentlyBrewedSignal", () => {
    it("is null when nothing is saved", () => {
      expect(mostRecentlyBrewedSignal.value).toBeNull();
    });

    it("is the single most recently active saved brew", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(older.id);

      expect(mostRecentlyBrewedSignal.value?.id).toBe(older.id);
    });
  });

  describe("recentSavedBrewsSignal", () => {
    it("is empty when nothing is saved", () => {
      expect(recentSavedBrewsSignal.value).toEqual([]);
    });

    it("orders a re-brewed older save ahead of a more-recently-saved, never-rebrewed one", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const newer = addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(older.id);

      const order = recentSavedBrewsSignal.value.map((b) => b.id);
      expect(order).toEqual([older.id, newer.id]);
    });

    it("falls back to createdAt ordering when neither brew has been re-brewed", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const newer = addSavedBrew(brew({ brewType: "Chemex" }));

      const order = recentSavedBrewsSignal.value.map((b) => b.id);
      expect(order).toEqual([newer.id, older.id]);
    });
  });

  describe("brewAgain", () => {
    it("stamps lastBrewedAt on the matching saved brew", () => {
      const saved = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);

      brewAgain(saved);

      const updated = savedBrewsSignal.value.find((b) => b.id === saved.id);
      expect(updated?.lastBrewedAt).toBe(Date.now());
    });

    it("opens the post-save sheet with that exact brew", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved);

      expect(postSaveSheetOpenSignal.value).toBe(true);
      expect(postSaveSheetBrewSignal.value?.id).toBe(saved.id);
      expect(postSaveSheetBrewSignal.value).toEqual(saved);
    });

    it("defaults the post-save sheet to not-already-on-detail", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved);

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(false);
    });

    it("forwards alreadyOnDetail through to the post-save sheet", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved, { alreadyOnDetail: true });

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(true);
    });
  });

  describe("brewAeropressRecipeNow", () => {
    it("adds a new saved brew with numbers/name/brewType derived from the recipe", () => {
      const recipe = aeropressRecipe();

      brewAeropressRecipeNow(recipe);

      expect(savedBrewsSignal.value).toHaveLength(1);
      const saved = savedBrewsSignal.value[0];
      expect(saved.brewType).toBe("Aeropress");
      expect(saved.name).toBe("Test Competitor · 2021");
      expect(saved.ratio).toBe(getAeropressRecipeRatio(recipe));
      expect(saved.water).toBe(recipe.totalWaterGrams);
      expect(saved.coffee).toBe(recipe.doseGrams);
      expect(saved.oz).toBe(gramsToOunces(recipe.totalWaterGrams));
    });

    it("sets brewSteps and recipeSource on the saved brew from the recipe's curated steps", () => {
      const recipe = aeropressRecipe();
      const expectedSteps = getAeropressRecipeSteps(recipe);

      brewAeropressRecipeNow(recipe);

      const saved = savedBrewsSignal.value[0];
      expect(saved.brewSteps).toEqual({ steps: expectedSteps });
      expect(saved.recipeSource).toEqual({
        recipeId: recipe.id,
        label: getAeropressRecipeLabel(recipe),
        ratio: getAeropressRecipeRatio(recipe),
        water: recipe.totalWaterGrams,
        coffee: recipe.doseGrams,
        steps: expectedSteps,
      });
    });

    it("opens the post-save sheet with that exact new brew", () => {
      const recipe = aeropressRecipe();

      brewAeropressRecipeNow(recipe);

      const saved = savedBrewsSignal.value[0];
      expect(postSaveSheetOpenSignal.value).toBe(true);
      expect(postSaveSheetBrewSignal.value).toEqual(saved);
    });

    it("does not mark the post-save sheet as already-on-detail", () => {
      brewAeropressRecipeNow(aeropressRecipe());

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(false);
    });
  });

  describe("brewEspressoRecipeNow", () => {
    describe("with a plain IEspressoShotStyle", () => {
      const style = ESPRESSO_SHOT_STYLES.find((item) => item.id === "double");
      if (!style) throw new Error("expected the 'double' shot style to exist in test data");

      it("adds a new saved brew with numbers/name/brewType derived from the style", () => {
        brewEspressoRecipeNow(style);

        expect(savedBrewsSignal.value).toHaveLength(1);
        const saved = savedBrewsSignal.value[0];
        expect(saved.brewType).toBe("Espresso Shot");
        expect(saved.name).toBe(style.label);
        expect(saved.ratio).toBe(style.ratio);
        expect(saved.water).toBe(style.doseOut);
        expect(saved.coffee).toBe(style.doseIn);
        expect(saved.oz).toBe(gramsToOunces(style.doseOut));
      });

      it("builds brewSteps/recipeSource using the style-wide preinfusion/grind/water-temp defaults", () => {
        const expectedSteps = buildEspressoSteps(
          ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
          style.shotTimeSec,
          ESPRESSO_STYLE_DEFAULT_GRIND,
          ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
        );

        brewEspressoRecipeNow(style);

        const saved = savedBrewsSignal.value[0];
        expect(saved.brewSteps).toEqual({ steps: expectedSteps });
        expect(saved.recipeSource).toEqual({
          recipeId: style.id,
          label: style.label,
          ratio: style.ratio,
          water: style.doseOut,
          coffee: style.doseIn,
          steps: expectedSteps,
        });
      });

      it("opens the post-save sheet with that exact new brew", () => {
        brewEspressoRecipeNow(style);

        const saved = savedBrewsSignal.value[0];
        expect(postSaveSheetOpenSignal.value).toBe(true);
        expect(postSaveSheetBrewSignal.value).toEqual(saved);
      });
    });

    describe("with an IEspressoProfile", () => {
      const profile = ESPRESSO_PROFILES.find((item) => item.id === "blooming-espresso");
      if (!profile)
        throw new Error("expected the 'blooming-espresso' profile to exist in test data");

      it("adds a new saved brew with numbers/name/brewType derived from the profile", () => {
        brewEspressoRecipeNow(profile);

        expect(savedBrewsSignal.value).toHaveLength(1);
        const saved = savedBrewsSignal.value[0];
        expect(saved.brewType).toBe("Espresso Shot");
        expect(saved.name).toBe(profile.name);
        expect(saved.ratio).toBe(profile.ratio);
        expect(saved.water).toBe(profile.doseOut);
        expect(saved.coffee).toBe(profile.doseIn);
        expect(saved.oz).toBe(gramsToOunces(profile.doseOut));
      });

      it("builds brewSteps/recipeSource using the profile's own preinfusion/grind/water-temp", () => {
        const expectedSteps = buildEspressoSteps(
          profile.preinfusionSec,
          profile.shotTimeSec,
          profile.grind,
          profile.waterTemp,
        );

        brewEspressoRecipeNow(profile);

        const saved = savedBrewsSignal.value[0];
        expect(saved.brewSteps).toEqual({ steps: expectedSteps });
        expect(saved.recipeSource).toEqual({
          recipeId: profile.id,
          label: profile.name,
          ratio: profile.ratio,
          water: profile.doseOut,
          coffee: profile.doseIn,
          steps: expectedSteps,
        });
      });

      it("opens the post-save sheet with that exact new brew", () => {
        brewEspressoRecipeNow(profile);

        const saved = savedBrewsSignal.value[0];
        expect(postSaveSheetOpenSignal.value).toBe(true);
        expect(postSaveSheetBrewSignal.value).toEqual(saved);
      });
    });
  });
});
