import { describe, expect, it } from "vitest";
import type { IShareableBrew } from "../../interfaces/brew.interface";
import { getBrewDisplayName } from "../brew-display.utility";

const baseBrew: IShareableBrew = {
  brewType: "Pour-over",
  ratio: 16,
  water: 300,
  coffee: 18.75,
  oz: 10.58,
};

describe("brew-display.utility", () => {
  describe("getBrewDisplayName", () => {
    it("returns the custom name when set", () => {
      expect(getBrewDisplayName({ ...baseBrew, name: "Sunday morning pour" })).toBe(
        "Sunday morning pour",
      );
    });

    it("falls back to brewType when name is undefined", () => {
      expect(getBrewDisplayName(baseBrew)).toBe("Pour-over");
    });

    it("falls back to brewType when name is an empty string", () => {
      expect(getBrewDisplayName({ ...baseBrew, name: "" })).toBe("Pour-over");
    });

    it("falls back to brewType when name is whitespace-only", () => {
      expect(getBrewDisplayName({ ...baseBrew, name: "   " })).toBe("Pour-over");
    });
  });
});
