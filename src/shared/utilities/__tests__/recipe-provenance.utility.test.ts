import "fake-indexeddb/auto";
import { render } from "lit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ILoadedRecipeSource } from "../../interfaces/brew.interface";
import type { IRecipeModifiedCurrent } from "../recipe-modified.utility";
import {
  renderOriginalRecipeSheet,
  renderRecipeProvenanceBanner,
} from "../recipe-provenance.utility";

const RECIPE_SOURCE: ILoadedRecipeSource = {
  recipeId: "2025-1",
  label: "Némo Pop · 2025, 1st place",
  ratio: 9.44,
  water: 170,
  coffee: 18,
  steps: [{ id: "x", label: "Bloom", kind: "timed", seconds: 30 }],
};

const matchingCurrent: IRecipeModifiedCurrent = {
  ratio: "9.44",
  water: "170",
  coffee: 18,
  steps: RECIPE_SOURCE.steps,
};

const modifiedCurrent: IRecipeModifiedCurrent = {
  ratio: "16",
  water: "170",
  coffee: 10.63,
  steps: [],
};

describe("recipe-provenance.utility", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("renderRecipeProvenanceBanner", () => {
    it("renders nothing when source is undefined", () => {
      render(renderRecipeProvenanceBanner(undefined, matchingCurrent, vi.fn()), container);
      expect(container.querySelector(".recipe-banner")).toBeNull();
    });

    it("renders nothing when source is null", () => {
      render(renderRecipeProvenanceBanner(null, matchingCurrent, vi.fn()), container);
      expect(container.querySelector(".recipe-banner")).toBeNull();
    });

    it('shows "Pulled from {label}" when the current values match the recipe snapshot', () => {
      render(renderRecipeProvenanceBanner(RECIPE_SOURCE, matchingCurrent, vi.fn()), container);
      const text = container.querySelector(".primed-banner-text");
      expect(text?.textContent?.trim()).toBe(`Pulled from ${RECIPE_SOURCE.label}`);
    });

    it('shows "Modified from {label} — tap to see the original" when the current values diverge from the recipe snapshot', () => {
      render(renderRecipeProvenanceBanner(RECIPE_SOURCE, modifiedCurrent, vi.fn()), container);
      const text = container.querySelector(".primed-banner-text");
      expect(text?.textContent?.trim()).toBe(
        `Modified from ${RECIPE_SOURCE.label} — tap to see the original`,
      );
    });

    it("calls onOpen when the banner button is clicked", () => {
      const onOpen = vi.fn();
      render(renderRecipeProvenanceBanner(RECIPE_SOURCE, matchingCurrent, onOpen), container);

      container.querySelector<HTMLButtonElement>(".recipe-banner")?.click();

      expect(onOpen).toHaveBeenCalledOnce();
    });
  });

  describe("renderOriginalRecipeSheet", () => {
    it("renders the sheet closed (not unmounted) when isOpen is false but a source is present, so a later open-to-close transition can still animate", () => {
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          false,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );
      const sheet = container.querySelector("brew-bottom-sheet");
      expect(sheet).not.toBeNull();
      expect(sheet?.hasAttribute("open")).toBe(false);
    });

    it("renders nothing when source is missing, even when isOpen is true", () => {
      render(
        renderOriginalRecipeSheet(null, true, vi.fn(), modifiedCurrent, "original", vi.fn()),
        container,
      );
      expect(container.querySelector("brew-bottom-sheet")).toBeNull();
    });

    it("renders the 'Original recipe' sheet with the recipe card when open with a source", () => {
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      const sheet = container.querySelector("brew-bottom-sheet");
      expect(sheet).not.toBeNull();
      expect(container.querySelector(".title")?.textContent?.trim()).toBe("Original recipe");
    });

    it("renders the Original/Diff toggle when the sheet is open with a source AND the brew is actually modified", () => {
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      const toggle = container.querySelector(".brew-steps-view-toggle");
      expect(toggle).not.toBeNull();
      expect(toggle?.querySelectorAll(".brew-steps-view-toggle-btn")).toHaveLength(2);
    });

    it("renders no toggle - and always forces the plain recipe card, ignoring viewMode - when the brew is unmodified (nothing to diff)", () => {
      render(
        renderOriginalRecipeSheet(RECIPE_SOURCE, true, vi.fn(), matchingCurrent, "diff", vi.fn()),
        container,
      );

      expect(container.querySelector(".brew-steps-view-toggle")).toBeNull();
      const card = container.querySelector("brew-recipe-card, brew-pourover-recipe-card");
      expect(card).not.toBeNull();
      expect((card as unknown as { diffAgainst: unknown }).diffAgainst).toBeNull();
    });

    it("in 'original' mode, renders the curated recipe card - not brew-steps-card", () => {
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      expect(container.querySelector("brew-steps-card")).toBeNull();
    });

    it("in 'diff' mode on a modified brew, still renders the curated recipe card - not brew-steps-card - with the brew's current steps as diffAgainst", () => {
      const current: IRecipeModifiedCurrent = {
        ...modifiedCurrent,
        steps: [{ id: "y", label: "Steep", kind: "note" as const, value: "Custom" }],
      };
      render(
        renderOriginalRecipeSheet(RECIPE_SOURCE, true, vi.fn(), current, "diff", vi.fn()),
        container,
      );

      expect(container.querySelector("brew-steps-card")).toBeNull();
      const card = container.querySelector("brew-recipe-card, brew-pourover-recipe-card");
      expect(card).not.toBeNull();
      expect((card as unknown as { diffAgainst: unknown }).diffAgainst).toEqual(current.steps);
    });

    it("in 'original' mode on a modified brew, passes null diffAgainst to the curated recipe card", () => {
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      const card = container.querySelector("brew-recipe-card, brew-pourover-recipe-card");
      expect(card).not.toBeNull();
      expect((card as unknown as { diffAgainst: unknown }).diffAgainst).toBeNull();
    });

    it("calls onViewModeChange with the newly selected mode when a toggle control is activated", () => {
      const onViewModeChange = vi.fn();
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          onViewModeChange,
        ),
        container,
      );

      const diffBtn = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".brew-steps-view-toggle-btn"),
      ).find((button) => button.textContent?.trim() === "Diff");
      diffBtn?.click();

      expect(onViewModeChange).toHaveBeenCalledExactlyOnceWith("diff");
    });

    it("falls back to the 'no longer available' message for a recipeId not in the registry", () => {
      render(
        renderOriginalRecipeSheet(
          { ...RECIPE_SOURCE, recipeId: "does-not-exist" },
          true,
          vi.fn(),
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      expect(container.textContent).toContain("This recipe is no longer available.");
    });

    it("calls onClose when the sheet fires sheet-scrim-click", () => {
      const onClose = vi.fn();
      render(
        renderOriginalRecipeSheet(
          RECIPE_SOURCE,
          true,
          onClose,
          modifiedCurrent,
          "original",
          vi.fn(),
        ),
        container,
      );

      container
        .querySelector("brew-bottom-sheet")
        ?.dispatchEvent(new CustomEvent("sheet-scrim-click"));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
