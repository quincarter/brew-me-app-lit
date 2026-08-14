import { render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  IBrewStep,
  IBrewStepsConfig,
  ILoadedRecipeSource,
} from "../../interfaces/brew.interface";
import {
  type BrewStepsViewMode,
  renderBrewStepsViewToggle,
  type RecipeSheetViewMode,
  renderRecipeSheetViewToggle,
  resolveBrewStepsForMode,
} from "../brew-steps-view.utility";

const recipeSteps: IBrewStep[] = [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }];

const recipeSource: ILoadedRecipeSource = {
  recipeId: "2025-1",
  label: "Némo Pop · 2025, 1st place",
  ratio: 9.44,
  water: 170,
  coffee: 18,
  steps: recipeSteps,
};

const brewSteps: IBrewStepsConfig = {
  steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 45 }],
};

describe("brew-steps-view.utility", () => {
  describe("resolveBrewStepsForMode", () => {
    describe('mode: "modified"', () => {
      it("returns the brew's own steps with no diffAgainst", () => {
        expect(resolveBrewStepsForMode(brewSteps, recipeSource, "modified")).toEqual({
          config: brewSteps,
          diffAgainst: null,
        });
      });

      it("returns a null config when brewSteps is null, regardless of recipeSource", () => {
        expect(resolveBrewStepsForMode(null, recipeSource, "modified")).toEqual({
          config: null,
          diffAgainst: null,
        });
      });

      it("returns a null config when brewSteps is undefined", () => {
        expect(resolveBrewStepsForMode(undefined, recipeSource, "modified")).toEqual({
          config: null,
          diffAgainst: null,
        });
      });

      it("still returns the brew's own steps when recipeSource is null/undefined", () => {
        expect(resolveBrewStepsForMode(brewSteps, null, "modified")).toEqual({
          config: brewSteps,
          diffAgainst: null,
        });
        expect(resolveBrewStepsForMode(brewSteps, undefined, "modified")).toEqual({
          config: brewSteps,
          diffAgainst: null,
        });
      });
    });

    describe('mode: "original"', () => {
      it("returns a fresh config wrapping the recipe source's own steps, with no diffAgainst", () => {
        expect(resolveBrewStepsForMode(brewSteps, recipeSource, "original")).toEqual({
          config: { steps: recipeSteps },
          diffAgainst: null,
        });
      });

      it("returns a null config when recipeSource is null", () => {
        expect(resolveBrewStepsForMode(brewSteps, null, "original")).toEqual({
          config: null,
          diffAgainst: null,
        });
      });

      it("returns a null config when recipeSource is undefined", () => {
        expect(resolveBrewStepsForMode(brewSteps, undefined, "original")).toEqual({
          config: null,
          diffAgainst: null,
        });
      });

      it("ignores brewSteps entirely - null/undefined brewSteps still resolves the recipe's steps", () => {
        expect(resolveBrewStepsForMode(null, recipeSource, "original")).toEqual({
          config: { steps: recipeSteps },
          diffAgainst: null,
        });
      });
    });

    describe('mode: "diff"', () => {
      it("returns the brew's own steps as config and the recipe source's steps as diffAgainst", () => {
        expect(resolveBrewStepsForMode(brewSteps, recipeSource, "diff")).toEqual({
          config: brewSteps,
          diffAgainst: recipeSteps,
        });
      });

      it("returns a null config but a real diffAgainst when brewSteps is missing", () => {
        expect(resolveBrewStepsForMode(null, recipeSource, "diff")).toEqual({
          config: null,
          diffAgainst: recipeSteps,
        });
        expect(resolveBrewStepsForMode(undefined, recipeSource, "diff")).toEqual({
          config: null,
          diffAgainst: recipeSteps,
        });
      });

      it("returns a real config but a null diffAgainst when recipeSource is missing", () => {
        expect(resolveBrewStepsForMode(brewSteps, null, "diff")).toEqual({
          config: brewSteps,
          diffAgainst: null,
        });
        expect(resolveBrewStepsForMode(brewSteps, undefined, "diff")).toEqual({
          config: brewSteps,
          diffAgainst: null,
        });
      });

      it("returns both null when neither brewSteps nor recipeSource is present", () => {
        expect(resolveBrewStepsForMode(null, null, "diff")).toEqual({
          config: null,
          diffAgainst: null,
        });
      });
    });
  });

  describe("renderBrewStepsViewToggle", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    const buttons = (): HTMLButtonElement[] =>
      Array.from(container.querySelectorAll<HTMLButtonElement>(".brew-steps-view-toggle-btn"));

    it("renders exactly three controls, labeled Modified/Original/Diff in that order", () => {
      render(renderBrewStepsViewToggle("modified", vi.fn()), container);

      const labels = buttons().map((button) => button.textContent?.trim());
      expect(labels).toEqual(["Modified", "Original", "Diff"]);
    });

    it("marks only the current mode's button active/selected", () => {
      render(renderBrewStepsViewToggle("diff", vi.fn()), container);

      const [modifiedBtn, originalBtn, diffBtn] = buttons();
      expect(modifiedBtn.classList.contains("active")).toBe(false);
      expect(modifiedBtn.getAttribute("aria-selected")).toBe("false");
      expect(originalBtn.classList.contains("active")).toBe(false);
      expect(diffBtn.classList.contains("active")).toBe(true);
      expect(diffBtn.getAttribute("aria-selected")).toBe("true");
    });

    it.each<[BrewStepsViewMode, number]>([
      ["modified", 0],
      ["original", 1],
      ["diff", 2],
    ])("clicking the %s control invokes onChange with %s", (mode, index) => {
      const onChange = vi.fn();
      render(renderBrewStepsViewToggle("modified", onChange), container);

      buttons()[index]?.click();

      expect(onChange).toHaveBeenCalledExactlyOnceWith(mode);
    });
  });

  describe("renderRecipeSheetViewToggle", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    const buttons = (): HTMLButtonElement[] =>
      Array.from(container.querySelectorAll<HTMLButtonElement>(".brew-steps-view-toggle-btn"));

    it("renders exactly two controls, labeled Original/Diff in that order - no Modified", () => {
      render(renderRecipeSheetViewToggle("original", vi.fn()), container);

      const labels = buttons().map((button) => button.textContent?.trim());
      expect(labels).toEqual(["Original", "Diff"]);
      expect(labels).not.toContain("Modified");
    });

    it("marks only the current mode's button active/selected", () => {
      render(renderRecipeSheetViewToggle("diff", vi.fn()), container);

      const [originalBtn, diffBtn] = buttons();
      expect(originalBtn.classList.contains("active")).toBe(false);
      expect(originalBtn.getAttribute("aria-selected")).toBe("false");
      expect(diffBtn.classList.contains("active")).toBe(true);
      expect(diffBtn.getAttribute("aria-selected")).toBe("true");
    });

    it("marks 'original' active when mode is 'original'", () => {
      render(renderRecipeSheetViewToggle("original", vi.fn()), container);

      const [originalBtn, diffBtn] = buttons();
      expect(originalBtn.classList.contains("active")).toBe(true);
      expect(originalBtn.getAttribute("aria-selected")).toBe("true");
      expect(diffBtn.classList.contains("active")).toBe(false);
      expect(diffBtn.getAttribute("aria-selected")).toBe("false");
    });

    it.each<[RecipeSheetViewMode, number]>([
      ["original", 0],
      ["diff", 1],
    ])("clicking the %s control invokes onChange with %s", (mode, index) => {
      const onChange = vi.fn();
      render(renderRecipeSheetViewToggle("original", onChange), container);

      buttons()[index]?.click();

      expect(onChange).toHaveBeenCalledExactlyOnceWith(mode);
    });
  });
});
