import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { IBrewTypeFeatures } from "../../interfaces/brew-type-features.interface";
import {
  brewTypeFeaturesSignal,
  getBrewTypeFeatures,
  isBrewTypeFeaturesLocked,
  setShowShotsSection,
  setTelemetryMode,
} from "../brew-type-features.store";

/**
 * `brewTypeFeaturesSignal` is typed as full `IBrewTypeFeatures` entries, but
 * `getBrewTypeFeatures` defensively merges over the default in case a
 * persisted/imported entry predates a newly-added field - this cast models
 * that legacy/partial-on-disk shape for the merge test below.
 */
const asStoredOverride = (partial: Partial<IBrewTypeFeatures>): IBrewTypeFeatures =>
  partial as IBrewTypeFeatures;

describe("brew-type-features.store", () => {
  beforeEach(() => {
    brewTypeFeaturesSignal.value = {};
  });

  describe("getBrewTypeFeatures", () => {
    it("returns the default features for a brew type with no stored override", () => {
      expect(getBrewTypeFeatures("V60")).toEqual({
        showShotsSection: true,
        telemetryMode: "full",
      });
    });

    it("merges a stored partial override over the default", () => {
      brewTypeFeaturesSignal.value = { V60: asStoredOverride({ telemetryMode: "chart-only" }) };

      expect(getBrewTypeFeatures("V60")).toEqual({
        showShotsSection: true,
        telemetryMode: "chart-only",
      });
    });

    it("returns a stored full override as-is", () => {
      brewTypeFeaturesSignal.value = {
        Chemex: { showShotsSection: false, telemetryMode: "off" },
      };

      expect(getBrewTypeFeatures("Chemex")).toEqual({
        showShotsSection: false,
        telemetryMode: "off",
      });
    });

    it("returns the locked-off features for Aeropress regardless of what's stored for it", () => {
      brewTypeFeaturesSignal.value = {
        Aeropress: { showShotsSection: true, telemetryMode: "full" },
      };

      expect(getBrewTypeFeatures("Aeropress")).toEqual({
        showShotsSection: false,
        telemetryMode: "off",
      });
    });
  });

  describe("isBrewTypeFeaturesLocked", () => {
    it("returns true for Aeropress", () => {
      expect(isBrewTypeFeaturesLocked("Aeropress")).toBe(true);
    });

    it("returns false for V60", () => {
      expect(isBrewTypeFeaturesLocked("V60")).toBe(false);
    });

    it("returns false for Chemex", () => {
      expect(isBrewTypeFeaturesLocked("Chemex")).toBe(false);
    });
  });

  describe("setShowShotsSection", () => {
    it("updates showShotsSection for an unlocked brew type, leaving its telemetryMode alone", () => {
      setTelemetryMode("V60", "chart-only");

      setShowShotsSection("V60", false);

      expect(getBrewTypeFeatures("V60")).toEqual({
        showShotsSection: false,
        telemetryMode: "chart-only",
      });
    });

    it("is a no-op for a locked brew type (Aeropress)", () => {
      setShowShotsSection("Aeropress", true);

      expect(brewTypeFeaturesSignal.value.Aeropress).toBeUndefined();
      expect(getBrewTypeFeatures("Aeropress")).toEqual({
        showShotsSection: false,
        telemetryMode: "off",
      });
    });
  });

  describe("setTelemetryMode", () => {
    it("updates telemetryMode for an unlocked brew type, leaving its showShotsSection alone", () => {
      setShowShotsSection("Chemex", false);

      setTelemetryMode("Chemex", "off");

      expect(getBrewTypeFeatures("Chemex")).toEqual({
        showShotsSection: false,
        telemetryMode: "off",
      });
    });

    it("is a no-op for a locked brew type (Aeropress)", () => {
      setTelemetryMode("Aeropress", "full");

      expect(brewTypeFeaturesSignal.value.Aeropress).toBeUndefined();
      expect(getBrewTypeFeatures("Aeropress")).toEqual({
        showShotsSection: false,
        telemetryMode: "off",
      });
    });
  });
});
