import { render } from "lit";
import { describe, expect, it } from "vitest";
import "../../../components/espresso-recipe-card/brew-espresso-recipe-card";
import { AEROPRESS_OTHER_RECIPES } from "../../data/aeropress-other-recipes.data";
import { AEROPRESS_RECIPES } from "../../data/aeropress-recipes.data";
import { ESPRESSO_PROFILES } from "../../data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../data/espresso-shot-styles.data";
import { V60_RECIPES } from "../../data/v60-recipes.data";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../aeropress-recipe.utility";
import { getEspressoRecipeLabel, getEspressoRecipeSteps } from "../espresso-recipe.utility";
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

    it("finds a non-championship AeroPress recipe by ID (registered as pourover kind)", () => {
      const result = findRecipeById("lance-hedrick-zuppa-lunga");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("pourover");
      expect(result?.recipe.id).toBe("lance-hedrick-zuppa-lunga");
    });

    it("finds an Origami recipe by ID", () => {
      const result = findRecipeById("kurasu-origami-iced-coffee");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("pourover");
    });

    it("finds a plain espresso shot style by ID", () => {
      const result = findRecipeById("double");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("espresso");
      expect(result?.recipe.id).toBe("double");
    });

    it("finds an espresso technique profile by ID", () => {
      const result = findRecipeById("blooming-espresso");
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("espresso");
      expect(result?.recipe.id).toBe("blooming-espresso");
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

    it("rebuilds the exact ILoadedRecipeSource snapshot for a known non-championship AeroPress recipe id", () => {
      const recipe = AEROPRESS_OTHER_RECIPES.find(
        (entry) => entry.id === "lance-hedrick-zuppa-lunga",
      );
      if (!recipe) {
        throw new Error(
          "Fixture recipe id 'lance-hedrick-zuppa-lunga' is no longer in AEROPRESS_OTHER_RECIPES.",
        );
      }

      const source = buildRecipeSource("lance-hedrick-zuppa-lunga");

      expect(source).toEqual({
        recipeId: "lance-hedrick-zuppa-lunga",
        label: getPouroverRecipeLabel(recipe),
        ratio: getPouroverRecipeRatio(recipe),
        water: parseWaterGrams(recipe),
        coffee: parseDoseGrams(recipe),
        steps: getPouroverRecipeSteps(recipe),
      });
    });

    it("rebuilds the exact ILoadedRecipeSource snapshot for a known espresso shot style id", () => {
      const recipe = ESPRESSO_SHOT_STYLES.find((entry) => entry.id === "double");
      if (!recipe)
        throw new Error("Fixture recipe id 'double' is no longer in ESPRESSO_SHOT_STYLES.");

      const source = buildRecipeSource("double");

      expect(source).toEqual({
        recipeId: "double",
        label: getEspressoRecipeLabel(recipe),
        ratio: recipe.ratio,
        water: recipe.doseOut,
        coffee: recipe.doseIn,
        steps: getEspressoRecipeSteps(recipe),
      });
    });

    it("rebuilds the exact ILoadedRecipeSource snapshot for a known espresso technique profile id", () => {
      const recipe = ESPRESSO_PROFILES.find((entry) => entry.id === "blooming-espresso");
      if (!recipe) {
        throw new Error("Fixture recipe id 'blooming-espresso' is no longer in ESPRESSO_PROFILES.");
      }

      const source = buildRecipeSource("blooming-espresso");

      expect(source).toEqual({
        recipeId: "blooming-espresso",
        label: getEspressoRecipeLabel(recipe),
        ratio: recipe.ratio,
        water: recipe.doseOut,
        coffee: recipe.doseIn,
        steps: getEspressoRecipeSteps(recipe),
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

    it("renders a brew-espresso-recipe-card for a known espresso shot style id", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      render(renderRecipeCard("double"), container);

      expect(container.querySelector("brew-espresso-recipe-card")).not.toBeNull();

      container.remove();
    });

    it("still shows 'no longer available' for an unknown espresso-shaped id", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      render(renderRecipeCard("unknown-espresso-id"), container);

      expect(container.querySelector("brew-espresso-recipe-card")).toBeNull();
      expect(container.textContent).toContain("This recipe is no longer available.");

      container.remove();
    });
  });
});
