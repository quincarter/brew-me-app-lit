import { describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../data/aeropress-recipes.data";
import { V60_RECIPES } from "../../data/v60-recipes.data";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../aeropress-recipe.utility";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  parseDoseGrams,
  parseWaterGrams,
} from "../pourover-recipe.utility";
import { buildRecipeSource, findRecipeById, renderRecipeCard } from "../recipe-registry.utility";

describe("recipe-registry.utility", () => {
  describe("findRecipeById", () => {
    it("finds an Aeropress recipe by ID", () => {
      const result = findRecipeById("2025-1");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("aeropress");
      expect(result?.recipe.id).toBe("2025-1");
    });

    it("finds a V60 pour-over recipe by ID", () => {
      const result = findRecipeById("rao");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("pourover");
      expect(result?.recipe.id).toBe("rao");
    });

    it("finds an Origami recipe by ID", () => {
      const result = findRecipeById("kurasu-origami-iced-coffee");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("pourover");
    });

    it("returns null for non-existent recipe ID", () => {
      const result = findRecipeById("unknown-recipe-999");
      expect(result).toBeNull();
    });
  });

  describe("buildRecipeSource", () => {
    it("rebuilds the exact ILoadedRecipeSource snapshot for a known Aeropress recipe id", () => {
      const recipe = AEROPRESS_RECIPES.find((entry) => entry.id === "2025-1");
      if (!recipe) throw new Error("Fixture recipe id '2025-1' is no longer in AEROPRESS_RECIPES.");

      const source = buildRecipeSource("2025-1");

      expect(source).toEqual({
        recipeId: "2025-1",
        label: getAeropressRecipeLabel(recipe),
        ratio: getAeropressRecipeRatio(recipe),
        water: recipe.totalWaterGrams,
        coffee: recipe.doseGrams,
        steps: getAeropressRecipeSteps(recipe),
      });
    });

    it("rebuilds the exact ILoadedRecipeSource snapshot for a known pour-over (V60) recipe id", () => {
      const recipe = V60_RECIPES.find((entry) => entry.id === "rao");
      if (!recipe) throw new Error("Fixture recipe id 'rao' is no longer in V60_RECIPES.");

      const source = buildRecipeSource("rao");

      expect(source).toEqual({
        recipeId: "rao",
        label: getPouroverRecipeLabel(recipe),
        ratio: getPouroverRecipeRatio(recipe),
        water: parseWaterGrams(recipe),
        coffee: parseDoseGrams(recipe),
        steps: getPouroverRecipeSteps(recipe),
      });
    });

    it("returns null for an unknown recipe id", () => {
      expect(buildRecipeSource("unknown-recipe-999")).toBeNull();
    });
  });

  describe("renderRecipeCard", () => {
    it("returns template result for a valid recipe ID", () => {
      const template = renderRecipeCard("rao-v60");
      expect(template).toBeDefined();
    });

    it("returns fallback message for an invalid recipe ID", () => {
      const template = renderRecipeCard("invalid-id");
      expect(template).toBeDefined();
    });
  });
});
