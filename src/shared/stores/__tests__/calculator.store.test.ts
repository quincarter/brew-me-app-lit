import { beforeEach, describe, expect, it } from "vitest";
import {
  coffeeSignal,
  ozSignal,
  primeCalculatorForBrew,
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
});
