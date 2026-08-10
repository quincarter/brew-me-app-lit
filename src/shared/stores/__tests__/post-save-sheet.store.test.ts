import { beforeEach, describe, expect, it } from "vitest";
import type { ISavedBrew } from "../../interfaces/brew.interface";
import {
  closePostSaveSheet,
  editBeforeBrewingIdSignal,
  openPostSaveSheet,
  postSaveSheetAlreadyOnDetailSignal,
  postSaveSheetBrewSignal,
  postSaveSheetOpenSignal,
  requestEditBeforeBrewing,
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
    postSaveSheetAlreadyOnDetailSignal.value = false;
    editBeforeBrewingIdSignal.value = null;
  });

  describe("openPostSaveSheet", () => {
    it("sets both the brew and open signals", () => {
      openPostSaveSheet(brew);

      expect(postSaveSheetBrewSignal.value).toEqual(brew);
      expect(postSaveSheetOpenSignal.value).toBe(true);
    });

    it("defaults alreadyOnDetail to false", () => {
      openPostSaveSheet(brew);

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(false);
    });

    it("sets alreadyOnDetail when passed", () => {
      openPostSaveSheet(brew, { alreadyOnDetail: true });

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(true);
    });

    it("resets alreadyOnDetail back to false on a later call without it", () => {
      openPostSaveSheet(brew, { alreadyOnDetail: true });
      openPostSaveSheet(brew);

      expect(postSaveSheetAlreadyOnDetailSignal.value).toBe(false);
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

  describe("requestEditBeforeBrewing", () => {
    it("sets the edit-before-brewing id and closes the sheet", () => {
      openPostSaveSheet(brew, { alreadyOnDetail: true });

      requestEditBeforeBrewing(brew.id);

      expect(editBeforeBrewingIdSignal.value).toBe(brew.id);
      expect(postSaveSheetOpenSignal.value).toBe(false);
    });
  });
});
