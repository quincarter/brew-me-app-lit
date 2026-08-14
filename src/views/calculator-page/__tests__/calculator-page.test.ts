import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import {
  loadAeropressRecipeIntoCalculator,
  selectBrewType,
  selectedBrewTypeSignal,
} from "../../../shared/stores/brew-steps.store";
import { deleteAllCustomBrewTypes } from "../../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../../shared/stores/brew.store";
import { resetCalculator, setRatio } from "../../../shared/stores/calculator.store";
import { cancelSaveDialog } from "../../../shared/stores/save-dialog.store";
import "../calculator-page";
import type { CalculatorPage } from "../calculator-page";

describe("calculator-page", () => {
  let element: CalculatorPage;

  beforeEach(async () => {
    resetCalculator();
    deleteAllSavedBrews();
    deleteAllCustomBrewTypes();
    cancelSaveDialog();

    element = document.createElement("calculator-page") as CalculatorPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  const findButtonByText = (text: string): Element | undefined =>
    Array.from(element.shadowRoot?.querySelectorAll("brew-button") ?? []).find((button) =>
      button.textContent?.replace(/\s+/g, " ").trim().includes(text),
    );

  const clickButton = (button: Element | undefined): void => {
    button?.shadowRoot?.querySelector("button")?.click();
  };

  describe("brew-type chooser", () => {
    it("renders the chooser first, before any type has been chosen", () => {
      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(element.shadowRoot?.querySelector(".chooser-intro")).not.toBeNull();
      expect(element.shadowRoot?.querySelector("brew-type-picker")).not.toBeNull();
      expect(element.shadowRoot?.querySelector("brew-ratio-form")).toBeNull();
    });

    it("picking 'Quick calculator' collapses the chooser and renders the plain ratio form, with none of the new brew-steps UI", async () => {
      clickButton(findButtonByText("Quick calculator"));
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".chooser-intro")).toBeNull();
      expect(element.shadowRoot?.querySelector("brew-ratio-form")).not.toBeNull();
      expect(element.shadowRoot?.querySelector(".type-chip-row")).toBeNull();
      expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
      expect(element.shadowRoot?.querySelector(".recipe-banner")).toBeNull();
      expect(findButtonByText("Load a WAC recipe")).toBeUndefined();
    });

    it("picking a specific method collapses the chooser and shows a type chip with a Change action", async () => {
      const picker = element.shadowRoot?.querySelector("brew-type-picker");
      picker?.dispatchEvent(
        new CustomEvent<string>("type-select", { detail: "V60", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(selectedBrewTypeSignal.value).toBe("V60");
      expect(element.shadowRoot?.querySelector(".type-chip")?.textContent?.trim()).toBe("V60");
      expect(element.shadowRoot?.querySelector("brew-ratio-form")).not.toBeNull();
    });

    it("'Change' re-opens the chooser without resetting the entered numbers", async () => {
      const picker = element.shadowRoot?.querySelector("brew-type-picker");
      picker?.dispatchEvent(
        new CustomEvent<string>("type-select", { detail: "V60", bubbles: true, composed: true }),
      );
      await element.updateComplete;
      setRatio("15");
      await element.updateComplete;

      clickButton(findButtonByText("Change"));
      await element.updateComplete;

      expect(selectedBrewTypeSignal.value).toBeNull();
      expect(element.shadowRoot?.querySelector(".chooser-intro")).not.toBeNull();
    });
  });

  describe("Brew Steps card", () => {
    it("appears for a type with a canned preset (Aeropress)", async () => {
      selectBrewType("Aeropress");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("brew-steps-card")).not.toBeNull();
    });

    it("does not appear for a type with no preset (Cold Brew)", async () => {
      selectBrewType("Cold Brew");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("brew-steps-card")).toBeNull();
    });

    it("only Aeropress gets the 'Load a WAC recipe' button", async () => {
      selectBrewType("V60");
      await element.updateComplete;
      expect(findButtonByText("Load a WAC recipe")).toBeUndefined();

      selectBrewType("Aeropress");
      await element.updateComplete;
      expect(findButtonByText("Load a WAC recipe")).not.toBeUndefined();
    });
  });

  describe("Pulled from / Modified from banner", () => {
    const recipe = AEROPRESS_RECIPES.find((item) => item.id === "2025-1");
    if (!recipe) throw new Error("expected the 2025-1 WAC recipe to exist in test data");

    it("shows 'Pulled from' right after loading a recipe, unedited", async () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(recipe);
      await element.updateComplete;

      const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
      expect(banner?.textContent?.trim()).toBe(
        `Pulled from ${recipe.competitor} · ${recipe.year}, 1st place`,
      );
    });

    it("switches to 'Modified from … — tap to see the original' once a number is hand-edited", async () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(recipe);
      await element.updateComplete;

      setRatio("16");
      await element.updateComplete;

      const banner = element.shadowRoot?.querySelector(".recipe-banner .primed-banner-text");
      expect(banner?.textContent?.trim()).toBe(
        `Modified from ${recipe.competitor} · ${recipe.year}, 1st place — tap to see the original`,
      );
    });

    it("does not render any banner for a plain (non-quick) brew type with no loaded recipe", async () => {
      selectBrewType("V60");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".recipe-banner")).toBeNull();
    });
  });

  describe("brew steps view toggle (recipeSource present)", () => {
    const recipe = AEROPRESS_RECIPES.find((item) => item.id === "2025-1");
    if (!recipe) throw new Error("expected the 2025-1 WAC recipe to exist in test data");

    it("renders no toggle right after loading a recipe, unedited - nothing to diff means the toggle would just be a confusing no-op", async () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(recipe);
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).toBeNull();
    });

    it("renders the toggle once a number is hand-edited away from the loaded recipe", async () => {
      selectBrewType("Aeropress");
      loadAeropressRecipeIntoCalculator(recipe);
      await element.updateComplete;

      setRatio("16");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".brew-steps-view-toggle")).not.toBeNull();
    });
  });
});
