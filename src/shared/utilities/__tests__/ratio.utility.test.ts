import { describe, expect, it } from "vitest";
import { coffeeForWater, gramsToOunces, ouncesToGrams, round2 } from "../ratio.utility";

describe("ratio.utility", () => {
  it("rounds to two decimal places", () => {
    expect(round2(16.6666)).toBe(16.67);
    expect(round2(16.001)).toBe(16);
  });

  it("converts grams to ounces", () => {
    expect(gramsToOunces(480)).toBeCloseTo(16.93, 1);
  });

  it("converts ounces to grams", () => {
    expect(ouncesToGrams(16)).toBe(454);
  });

  it("computes coffee needed for a given water amount and ratio", () => {
    expect(coffeeForWater(480, 16)).toBe(30);
    expect(coffeeForWater(36, 2)).toBe(18);
  });

  it("returns null for invalid input", () => {
    expect(coffeeForWater(Number.NaN, 16)).toBeNull();
    expect(coffeeForWater(480, 0)).toBeNull();
  });
});
