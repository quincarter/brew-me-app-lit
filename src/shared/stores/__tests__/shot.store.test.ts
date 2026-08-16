import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { IBrewShot } from "../../interfaces/shot.interface";
import { addShot, getShotsForBrew, savedShotsSignal } from "../shot.store";

const shot = (overrides: Partial<Omit<IBrewShot, "id" | "createdAt">> = {}) => ({
  savedBrewId: 1,
  elapsedSeconds: 120,
  scaleSamples: [],
  monitorSamples: [],
  ...overrides,
});

describe("shot.store", () => {
  beforeEach(() => {
    savedShotsSignal.value = [];
  });

  describe("addShot", () => {
    it("creates a shot with a generated id/createdAt and appends it to savedShotsSignal", () => {
      const saved = addShot(shot());

      expect(saved.id).toBeTypeOf("number");
      expect(saved.createdAt).toBeTypeOf("number");
      expect(saved.savedBrewId).toBe(1);
      expect(saved.elapsedSeconds).toBe(120);
      expect(savedShotsSignal.value).toEqual([saved]);
    });

    it("appends to any existing shots rather than replacing them", () => {
      const first = addShot(shot({ savedBrewId: 1 }));
      const second = addShot(shot({ savedBrewId: 2 }));

      expect(savedShotsSignal.value).toEqual([first, second]);
    });
  });

  describe("getShotsForBrew", () => {
    it("filters shots by savedBrewId", () => {
      const first = addShot(shot({ savedBrewId: 1 }));
      addShot(shot({ savedBrewId: 2 }));
      const third = addShot(shot({ savedBrewId: 1 }));

      expect(getShotsForBrew(1)).toEqual([first, third]);
    });

    it("returns an empty array for a brew with no recorded shots", () => {
      addShot(shot({ savedBrewId: 1 }));

      expect(getShotsForBrew(999)).toEqual([]);
    });
  });
});
