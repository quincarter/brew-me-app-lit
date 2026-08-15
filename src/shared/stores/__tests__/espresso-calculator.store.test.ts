import { beforeEach, describe, expect, it } from "vitest";
import {
  espressoDoseInSignal,
  espressoDoseOutSignal,
  espressoRatioSignal,
  resetEspressoCalculator,
  setEspressoDoseIn,
  setEspressoDoseOut,
  setEspressoRatio,
} from "../espresso-calculator.store";

describe("espresso-calculator.store", () => {
  beforeEach(() => {
    resetEspressoCalculator();
  });

  it("defaults to an 18g in / 1:2 / 36g out double shot", () => {
    expect(espressoDoseInSignal.value).toBe(18);
    expect(espressoRatioSignal.value).toBe(2);
    expect(espressoDoseOutSignal.value).toBe(36);
  });

  describe("setEspressoDoseIn", () => {
    it("recomputes dose-out from the current ratio, holding ratio fixed", () => {
      setEspressoDoseIn("20");

      expect(espressoDoseInSignal.value).toBe(20);
      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(40);
    });

    it("is a no-op for NaN input", () => {
      setEspressoDoseIn("abc");

      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoDoseOutSignal.value).toBe(36);
    });

    it("is a no-op for negative input", () => {
      setEspressoDoseIn("-5");

      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoDoseOutSignal.value).toBe(36);
    });

    it("allows zero", () => {
      setEspressoDoseIn("0");

      expect(espressoDoseInSignal.value).toBe(0);
      expect(espressoDoseOutSignal.value).toBe(0);
    });
  });

  describe("setEspressoRatio", () => {
    it("recomputes dose-out from the current dose-in, holding dose-in fixed", () => {
      setEspressoRatio("3");

      expect(espressoRatioSignal.value).toBe(3);
      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoDoseOutSignal.value).toBe(54);
    });

    it("is a no-op for NaN input", () => {
      setEspressoRatio("abc");

      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(36);
    });

    it("is a no-op for negative input", () => {
      setEspressoRatio("-2");

      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(36);
    });
  });

  describe("setEspressoDoseOut", () => {
    it("recomputes the ratio (rounded to 1 decimal) from the current dose-in, holding dose-in fixed", () => {
      setEspressoDoseOut("44");

      expect(espressoDoseOutSignal.value).toBe(44);
      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoRatioSignal.value).toBe(2.4);
    });

    it("is a no-op for NaN input", () => {
      setEspressoDoseOut("abc");

      expect(espressoDoseOutSignal.value).toBe(36);
      expect(espressoRatioSignal.value).toBe(2);
    });

    it("is a no-op for negative input", () => {
      setEspressoDoseOut("-10");

      expect(espressoDoseOutSignal.value).toBe(36);
      expect(espressoRatioSignal.value).toBe(2);
    });

    it("does not change the ratio when dose-in is 0, since dividing by it would be meaningless", () => {
      setEspressoDoseIn("0");

      setEspressoDoseOut("50");

      expect(espressoDoseOutSignal.value).toBe(50);
      expect(espressoDoseInSignal.value).toBe(0);
      // Ratio is left untouched rather than becoming Infinity/NaN.
      expect(espressoRatioSignal.value).toBe(2);
    });

    it("still updates dose-out itself even when dose-in is 0", () => {
      setEspressoDoseIn("0");

      setEspressoDoseOut("0");

      expect(espressoDoseOutSignal.value).toBe(0);
    });
  });

  describe("resetEspressoCalculator", () => {
    it("restores the 18/2/36 defaults after edits", () => {
      setEspressoDoseIn("20");
      setEspressoRatio("2.5");
      setEspressoDoseOut("70");

      resetEspressoCalculator();

      expect(espressoDoseInSignal.value).toBe(18);
      expect(espressoRatioSignal.value).toBe(2);
      expect(espressoDoseOutSignal.value).toBe(36);
    });
  });
});
