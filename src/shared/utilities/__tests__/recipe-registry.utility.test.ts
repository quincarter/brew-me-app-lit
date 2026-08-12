import { describe, expect, it } from "vitest";
import { findRecipeById, renderRecipeCard } from "../recipe-registry.utility";

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
