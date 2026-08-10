import { beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../interfaces/brew.interface";
import {
  closePostSaveSheet,
  openPostSaveSheet,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
} from "../post-save-sheet.store";

const brew: ISavedBrew = {
  id: 1,
  brewType: "V60",
  ratio: 16,
  water: 320,
  coffee: 20,
  oz: 11,
  createdAt: Date.now(),
};

describe("post-save-sheet.store", () => {
  beforeEach(() => {
    postSaveSheetOpenSignal.value = false;
    postSaveSheetBrewSignal.value = null;
  });

  describe("openPostSaveSheet", () => {
    it("sets both the brew and open signals", () => {
      openPostSaveSheet(brew);

      expect(postSaveSheetBrewSignal.value).toEqual(brew);
      expect(postSaveSheetOpenSignal.value).toBe(true);
    });
  });

  describe("closePostSaveSheet", () => {
    it("sets open to false without clearing the brew signal", () => {
      openPostSaveSheet(brew);

      closePostSaveSheet();

      expect(postSaveSheetOpenSignal.value).toBe(false);
      expect(postSaveSheetBrewSignal.value).toEqual(brew);
    });
  });
});
