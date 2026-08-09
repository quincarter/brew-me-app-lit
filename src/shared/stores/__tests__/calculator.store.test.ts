import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../interfaces/brew.interface";
import { deleteAllSavedBrews, savedBrewsSignal } from "../brew.store";
import {
  brewAgain,
  coffeeSignal,
  dismissPrimedBanner,
  ozSignal,
  primeCalculatorForBrew,
  primedBrewTypeSignal,
  primedFromNameSignal,
  ratioSignal,
  resetCalculator,
  setOz,
  setRatio,
  setWater,
  waterSignal,
} from "../calculator.store";

describe("calculator.store", () => {
  beforeEach(() => {
    resetCalculator();
    deleteAllSavedBrews();
  });

  it("computes coffee when water is entered", () => {
    setWater("480");
    expect(coffeeSignal.value).toBe(30);
    expect(ozSignal.value).not.toBe("");
  });

  it("keeps water and oz in sync", () => {
    setOz("16");
    expect(waterSignal.value).toBe("454");
  });

  it("recomputes coffee when the ratio changes", () => {
    setWater("480");
    setRatio("15");
    expect(coffeeSignal.value).toBe(32);
  });

  it("resets to defaults", () => {
    setWater("480");
    resetCalculator();
    expect(waterSignal.value).toBe("");
    expect(coffeeSignal.value).toBeNull();
    expect(ratioSignal.value).toBe("16");
  });

  it("primes the calculator with a shared brew's exact numbers", () => {
    primeCalculatorForBrew({ brewType: "Pour-over", ratio: 15, water: 300, coffee: 20, oz: 10.58 });
    expect(ratioSignal.value).toBe("15");
    expect(waterSignal.value).toBe("300");
    expect(ozSignal.value).toBe("10.58");
    expect(coffeeSignal.value).toBe(20);
  });

  describe("dismissPrimedBanner", () => {
    it("clears only the banner name, not the entered numbers", () => {
      primeCalculatorForBrew({
        brewType: "Pour-over",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10.58,
      });
      primedFromNameSignal.value = "Sunday morning pour";

      dismissPrimedBanner();

      expect(primedFromNameSignal.value).toBeNull();
      expect(waterSignal.value).toBe("300");
      expect(coffeeSignal.value).toBe(20);
    });
  });

  describe("resetCalculator", () => {
    it("also clears the primed banner and brew type", () => {
      primeCalculatorForBrew({
        brewType: "Pour-over",
        ratio: 15,
        water: 300,
        coffee: 20,
        oz: 10.58,
      });
      primedFromNameSignal.value = "Sunday morning pour";

      resetCalculator();

      expect(primedFromNameSignal.value).toBeNull();
      expect(primedBrewTypeSignal.value).toBeNull();
    });
  });

  describe("brewAgain", () => {
    const savedBrew: ISavedBrew = {
      id: 1,
      brewType: "V60",
      name: "Sunday morning pour",
      ratio: 15,
      water: 300,
      coffee: 20,
      oz: 10.58,
      createdAt: 0,
    };

    it("stamps the brew as brewed, primes the calculator, and sets the banner name", () => {
      savedBrewsSignal.value = [savedBrew];

      brewAgain(savedBrew);

      expect(waterSignal.value).toBe("300");
      expect(coffeeSignal.value).toBe(20);
      expect(ratioSignal.value).toBe("15");
      expect(primedFromNameSignal.value).toBe("Sunday morning pour");
      expect(savedBrewsSignal.value[0]?.lastBrewedAt).toBeDefined();
    });

    it("navigates to /calculate", () => {
      savedBrewsSignal.value = [savedBrew];

      brewAgain(savedBrew);

      expect(window.location.pathname).toBe("/calculate");
    });

    it("falls back to the brew type for the banner name when no custom name is set", () => {
      const unnamedBrew: ISavedBrew = { ...savedBrew, name: undefined };
      savedBrewsSignal.value = [unnamedBrew];

      brewAgain(unnamedBrew);

      expect(primedFromNameSignal.value).toBe("V60");
    });
  });
});
