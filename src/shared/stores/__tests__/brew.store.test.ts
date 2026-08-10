import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IShareableBrew } from "../../interfaces/brew.interface";
import {
  addSavedBrew,
  brewAgain,
  deleteAllSavedBrews,
  markBrewedNow,
  mostRecentlyBrewedSignal,
  recentSavedBrewsSignal,
  savedBrewsSignal,
} from "../brew.store";
import {
  closePostSaveSheet,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../post-save-sheet.store";

const brew = (overrides: Partial<IShareableBrew> = {}): IShareableBrew => ({
  brewType: "Pour-over",
  ratio: 16,
  water: 480,
  coffee: 30,
  oz: 16.93,
  ...overrides,
});

describe("brew.store", () => {
  beforeEach(() => {
    deleteAllSavedBrews();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    closePostSaveSheet();
    postSaveSheetBrewSignal.value = null;
  });

  describe("markBrewedNow", () => {
    it("stamps lastBrewedAt on the matching brew and leaves others untouched", () => {
      const first = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const second = addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(first.id);

      const updatedFirst = savedBrewsSignal.value.find((b) => b.id === first.id);
      const updatedSecond = savedBrewsSignal.value.find((b) => b.id === second.id);

      expect(updatedFirst?.lastBrewedAt).toBe(Date.now());
      expect(updatedSecond?.lastBrewedAt).toBeUndefined();
    });
  });

  describe("mostRecentlyBrewedSignal", () => {
    it("is null when nothing is saved", () => {
      expect(mostRecentlyBrewedSignal.value).toBeNull();
    });

    it("is the single most recently active saved brew", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(older.id);

      expect(mostRecentlyBrewedSignal.value?.id).toBe(older.id);
    });
  });

  describe("recentSavedBrewsSignal", () => {
    it("is empty when nothing is saved", () => {
      expect(recentSavedBrewsSignal.value).toEqual([]);
    });

    it("orders a re-brewed older save ahead of a more-recently-saved, never-rebrewed one", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const newer = addSavedBrew(brew({ brewType: "Chemex" }));

      vi.advanceTimersByTime(1000);
      markBrewedNow(older.id);

      const order = recentSavedBrewsSignal.value.map((b) => b.id);
      expect(order).toEqual([older.id, newer.id]);
    });

    it("falls back to createdAt ordering when neither brew has been re-brewed", () => {
      const older = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);
      const newer = addSavedBrew(brew({ brewType: "Chemex" }));

      const order = recentSavedBrewsSignal.value.map((b) => b.id);
      expect(order).toEqual([newer.id, older.id]);
    });
  });

  describe("brewAgain", () => {
    it("stamps lastBrewedAt on the matching saved brew", () => {
      const saved = addSavedBrew(brew({ brewType: "V60" }));
      vi.advanceTimersByTime(1000);

      brewAgain(saved);

      const updated = savedBrewsSignal.value.find((b) => b.id === saved.id);
      expect(updated?.lastBrewedAt).toBe(Date.now());
    });

    it("opens the post-save sheet with that exact brew", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved);

      expect(postSaveSheetOpenSignal.value).toBe(true);
      expect(postSaveSheetBrewSignal.value?.id).toBe(saved.id);
      expect(postSaveSheetBrewSignal.value).toEqual(saved);
    });

    it("defaults the post-save sheet to not-already-on-detail", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved);

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(false);
    });

    it("forwards alreadyOnDetail through to the post-save sheet", () => {
      const saved = addSavedBrew(brew({ brewType: "Chemex" }));

      brewAgain(saved, { alreadyOnDetail: true });

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(true);
    });
  });
});
