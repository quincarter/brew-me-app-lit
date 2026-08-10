import { describe, expect, it } from "vitest";
import { BREW_ICON_MAP, getBrewTypeIcon, normalizeBrewIconKey } from "../brew-icon.utility";

describe("brew-icon.utility", () => {
  describe("normalizeBrewIconKey", () => {
    it("lowercases the value", () => {
      expect(normalizeBrewIconKey("V60")).toBe("v60");
    });

    it("replaces spaces with hyphens", () => {
      expect(normalizeBrewIconKey("Cold Brew")).toBe("cold-brew");
    });

    it("trims leading and trailing whitespace", () => {
      expect(normalizeBrewIconKey("  Chemex  ")).toBe("chemex");
    });

    it("collapses runs of whitespace into a single hyphen", () => {
      expect(normalizeBrewIconKey("French   Press")).toBe("french-press");
    });
  });

  describe("getBrewTypeIcon", () => {
    it("returns the mapped icon for a known brew type", () => {
      expect(getBrewTypeIcon("V60")).toBe(BREW_ICON_MAP["v60"]);
    });

    it("prioritizes a known iconOverride over the brewType match", () => {
      expect(getBrewTypeIcon("V60", "chemex")).toBe(BREW_ICON_MAP["chemex"]);
    });

    it("falls back to the brewType match when the override is unknown", () => {
      expect(getBrewTypeIcon("V60", "not-a-real-icon")).toBe(BREW_ICON_MAP["v60"]);
    });

    it("returns undefined when neither the brewType nor override resolve", () => {
      expect(getBrewTypeIcon("My Weird Method")).toBeUndefined();
    });

    it("returns undefined when neither resolve, even with an unknown override provided", () => {
      expect(getBrewTypeIcon("My Weird Method", "not-a-real-icon")).toBeUndefined();
    });
  });
});
