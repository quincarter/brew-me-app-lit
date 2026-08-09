import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAllSavedBrews, savedBrewsSignal } from "../brew.store";
import { resetCalculator, setWater } from "../calculator.store";
import {
  cancelSaveDialog,
  confirmSave,
  openSaveDialog,
  pendingBrewIconSignal,
  pendingBrewNameSignal,
  pendingBrewTypeSignal,
  saveDialogOpenSignal,
  selectPendingBrewIcon,
  selectPendingBrewType,
  setPendingBrewName,
  shareAfterSaveSignal,
} from "../save-dialog.store";

describe("save-dialog.store", () => {
  beforeEach(() => {
    resetCalculator();
    deleteAllSavedBrews();
    saveDialogOpenSignal.value = false;
    pendingBrewTypeSignal.value = null;
    pendingBrewNameSignal.value = "";
    pendingBrewIconSignal.value = "";
    shareAfterSaveSignal.value = false;
  });

  describe("openSaveDialog", () => {
    it("opens the sheet in non-share mode by default", () => {
      openSaveDialog();

      expect(saveDialogOpenSignal.value).toBe(true);
      expect(shareAfterSaveSignal.value).toBe(false);
    });

    it("clears any previously pending type and name", () => {
      selectPendingBrewType("Pour-over");
      setPendingBrewName("Sunday morning pour");

      openSaveDialog();

      expect(pendingBrewTypeSignal.value).toBeNull();
      expect(pendingBrewNameSignal.value).toBe("");
    });

    it("clears any previously pending icon", () => {
      selectPendingBrewType("Pour-over");
      selectPendingBrewIcon("chemex");

      openSaveDialog();

      expect(pendingBrewIconSignal.value).toBe("");
    });

    it("sets shareAfterSave when requested", () => {
      openSaveDialog({ shareAfterSave: true });

      expect(shareAfterSaveSignal.value).toBe(true);
    });
  });

  describe("cancelSaveDialog", () => {
    it("closes the sheet and resets shareAfterSave", () => {
      openSaveDialog({ shareAfterSave: true });

      cancelSaveDialog();

      expect(saveDialogOpenSignal.value).toBe(false);
      expect(shareAfterSaveSignal.value).toBe(false);
    });
  });

  describe("selectPendingBrewType", () => {
    it("sets the pending brew type", () => {
      selectPendingBrewType("Chemex");

      expect(pendingBrewTypeSignal.value).toBe("Chemex");
    });

    it("resets any previously pending icon", () => {
      selectPendingBrewType("Chemex");
      selectPendingBrewIcon("chemex");

      selectPendingBrewType("Aeropress");

      expect(pendingBrewIconSignal.value).toBe("");
    });
  });

  describe("selectPendingBrewIcon", () => {
    it("sets the pending icon", () => {
      selectPendingBrewIcon("chemex");

      expect(pendingBrewIconSignal.value).toBe("chemex");
    });
  });

  describe("confirmSave", () => {
    it("returns null and saves nothing when no brew type is pending", async () => {
      setWater("480");

      const outcome = await confirmSave();

      expect(outcome).toBeNull();
      expect(savedBrewsSignal.value).toHaveLength(0);
    });

    it("returns null and saves nothing when there's no computed coffee amount", async () => {
      selectPendingBrewType("Pour-over");

      const outcome = await confirmSave();

      expect(outcome).toBeNull();
      expect(savedBrewsSignal.value).toHaveLength(0);
    });

    it("saves the brew with an undefined name when left blank, and returns null outside share mode", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");

      const outcome = await confirmSave();

      expect(outcome).toBeNull();
      expect(savedBrewsSignal.value).toHaveLength(1);
      expect(savedBrewsSignal.value[0]?.name).toBeUndefined();
      expect(savedBrewsSignal.value[0]?.brewType).toBe("Pour-over");
    });

    it("stores a whitespace-only name as undefined, not as whitespace", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");
      setPendingBrewName("   ");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.name).toBeUndefined();
    });

    it("stores a trimmed custom name", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");
      setPendingBrewName("  Sunday morning pour  ");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.name).toBe("Sunday morning pour");
    });

    it("includes the pending icon on the saved brew when one is set", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");
      selectPendingBrewIcon("chemex");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.icon).toBe("chemex");
    });

    it("omits the icon field when no pending icon is set", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.icon).toBeUndefined();
    });

    it("closes the sheet and resets the calculator after saving", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");
      saveDialogOpenSignal.value = true;

      await confirmSave();

      expect(saveDialogOpenSignal.value).toBe(false);
      expect(shareAfterSaveSignal.value).toBe(false);
    });

    describe("with shareAfterSave enabled", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      beforeEach(() => {
        writeText.mockClear();
        vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it("returns a ShareOutcome instead of null", async () => {
        setWater("480");
        selectPendingBrewType("Pour-over");
        openSaveDialog({ shareAfterSave: true });
        selectPendingBrewType("Pour-over");

        const outcome = await confirmSave();

        expect(outcome).toBe("copied");
        expect(writeText).toHaveBeenCalledTimes(1);
      });
    });
  });
});
