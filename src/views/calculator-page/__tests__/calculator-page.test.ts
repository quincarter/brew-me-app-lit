import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AEROPRESS_RECIPES } from "../../../shared/data/aeropress-recipes.data";
import { ESPRESSO_PROFILES } from "../../../shared/data/espresso-profiles.data";
import { ESPRESSO_SHOT_STYLES } from "../../../shared/data/espresso-shot-styles.data";
import {
  loadAeropressRecipeIntoCalculator,
  selectBrewType,
  selectedBrewTypeSignal,
} from "../../../shared/stores/brew-steps.store";
import { deleteAllCustomBrewTypes } from "../../../shared/stores/brew-types.store";
import { deleteAllSavedBrews } from "../../../shared/stores/brew.store";
import { resetCalculator, setRatio } from "../../../shared/stores/calculator.store";
import {
  espressoDoseInSignal,
  espressoDoseOutSignal,
  espressoRatioSignal,
  resetEspressoCalculator,
} from "../../../shared/stores/espresso-calculator.store";
import { cancelSaveDialog } from "../../../shared/stores/save-dialog.store";
import "../calculator-page";
import type { CalculatorPage } from "../calculator-page";

describe("calculator-page", () => {
  let element: CalculatorPage;

  beforeEach(async () => {
    resetCalculator();
    resetEspressoCalculator();
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

  describe("Espresso Shot branch", () => {
    it("renders brew-espresso-calculator instead of brew-ratio-form when Espresso Shot is selected", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector("brew-espresso-calculator")).not.toBeNull();
      expect(element.shadowRoot?.querySelector("brew-ratio-form")).toBeNull();
    });

    it("passes dose-in/ratio/dose-out from the espresso store through to brew-espresso-calculator", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      const calculator = element.shadowRoot?.querySelector("brew-espresso-calculator");
      expect(calculator?.getAttribute("dose-in")).toBe(String(espressoDoseInSignal.value));
      expect(calculator?.getAttribute("ratio")).toBe(String(espressoRatioSignal.value));
      expect(calculator?.getAttribute("dose-out")).toBe(String(espressoDoseOutSignal.value));
    });

    it("hides the .ratio-tips block for Espresso Shot", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".ratio-tips")).toBeNull();
    });

    it("still shows the .ratio-tips block for a non-espresso type", async () => {
      selectBrewType("V60");
      await element.updateComplete;

      expect(element.shadowRoot?.querySelector(".ratio-tips")).not.toBeNull();
    });

    it("disables Save/Share/Start guided timer when the espresso store has no dose-in or dose-out", async () => {
      selectBrewType("Espresso Shot");
      resetEspressoCalculator();
      await element.updateComplete;
      const calculator = element.shadowRoot?.querySelector("brew-espresso-calculator");
      calculator?.dispatchEvent(
        new CustomEvent<string>("dose-in-change", { detail: "0", bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(findButtonByText("Save")?.hasAttribute("disabled")).toBe(true);
      expect(findButtonByText("Share")?.hasAttribute("disabled")).toBe(true);
      expect(findButtonByText("Start guided timer")?.hasAttribute("disabled")).toBe(true);
    });

    it("enables Save/Share/Start guided timer once the espresso store has both a dose-in and dose-out", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      expect(findButtonByText("Save")?.hasAttribute("disabled")).toBe(false);
      expect(findButtonByText("Share")?.hasAttribute("disabled")).toBe(false);
      expect(findButtonByText("Start guided timer")?.hasAttribute("disabled")).toBe(false);
    });

    it("Reset restores the espresso store's 18/2/36 defaults and re-opens the brew-type chooser", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;
      const calculator = element.shadowRoot?.querySelector("brew-espresso-calculator");
      calculator?.dispatchEvent(
        new CustomEvent<string>("dose-in-change", { detail: "22", bubbles: true, composed: true }),
      );
      await element.updateComplete;
      expect(espressoDoseInSignal.value).toBe(22);

      clickButton(findButtonByText("Reset"));
      await element.updateComplete;

      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(36);
      expect(selectedBrewTypeSignal.value).toBeNull();
    });

    it("loading a shot style from the recipe picker routes to loadEspressoShotStyleIntoCalculator", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      const targetStyle = ESPRESSO_SHOT_STYLES[0];
      const sheet = element.shadowRoot?.querySelector("brew-recipe-picker-sheet");
      sheet?.dispatchEvent(
        new CustomEvent("recipe-select", { detail: targetStyle, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(espressoDoseInSignal.value).toBe(targetStyle.doseIn);
      expect(espressoRatioSignal.value).toBe(targetStyle.ratio);
      expect(espressoDoseOutSignal.value).toBe(targetStyle.doseOut);
    });

    it("loading a profile from the recipe picker routes to loadEspressoProfileIntoCalculator", async () => {
      selectBrewType("Espresso Shot");
      await element.updateComplete;

      const targetProfile = ESPRESSO_PROFILES[0];
      const sheet = element.shadowRoot?.querySelector("brew-recipe-picker-sheet");
      sheet?.dispatchEvent(
        new CustomEvent("recipe-select", { detail: targetProfile, bubbles: true, composed: true }),
      );
      await element.updateComplete;

      expect(espressoDoseInSignal.value).toBe(targetProfile.doseIn);
      expect(espressoRatioSignal.value).toBe(targetProfile.ratio);
      expect(espressoDoseOutSignal.value).toBe(targetProfile.doseOut);
      expect(element.shadowRoot?.querySelector("brew-steps-card")).not.toBeNull();
    });

    it("only Espresso Shot gets the 'Load an espresso recipe' button label", async () => {
      selectBrewType("V60");
      await element.updateComplete;
      expect(findButtonByText("Load an espresso recipe")).toBeUndefined();

      selectBrewType("Espresso Shot");
      await element.updateComplete;
      expect(findButtonByText("Load an espresso recipe")).not.toBeUndefined();
    });
  });
});
