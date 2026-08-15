import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IBrewStepsConfig, ILoadedRecipeSource } from "../../interfaces/brew.interface";
import {
  QUICK_CALCULATOR,
  loadedRecipeSourceSignal,
  selectBrewType,
  selectedBrewTypeSignal,
  updateBrewStepsConfig,
} from "../brew-steps.store";
import { deleteAllSavedBrews, savedBrewsSignal } from "../brew.store";
import {
  coffeeSignal,
  ozSignal,
  ratioSignal,
  resetCalculator,
  setWater,
  waterSignal,
} from "../calculator.store";
import {
  espressoDoseInSignal,
  espressoDoseOutSignal,
  espressoRatioSignal,
  resetEspressoCalculator,
  setEspressoDoseIn,
  setEspressoDoseOut,
  setEspressoRatio,
} from "../espresso-calculator.store";
import {
  cancelSaveDialog,
  confirmSave,
  openSaveDialog,
  pendingBrewIconSignal,
  pendingBrewNameSignal,
  pendingBrewTypeSignal,
  saveDialogOpenSignal,
  saveIntentSignal,
  selectPendingBrewIcon,
  selectPendingBrewType,
  setPendingBrewName,
} from "../save-dialog.store";

describe("save-dialog.store", () => {
  beforeEach(() => {
    resetCalculator();
    resetEspressoCalculator();
    deleteAllSavedBrews();
    saveDialogOpenSignal.value = false;
    pendingBrewTypeSignal.value = null;
    pendingBrewNameSignal.value = "";
    pendingBrewIconSignal.value = "";
    saveIntentSignal.value = "save";
  });

  describe("openSaveDialog", () => {
    it("opens the sheet in plain save mode by default", () => {
      openSaveDialog();

      expect(saveDialogOpenSignal.value).toBe(true);
      expect(saveIntentSignal.value).toBe("save");
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

    it("prefills the pending brew type from a real, already-chosen calculator brew type", () => {
      selectBrewType("Aeropress");

      openSaveDialog();

      expect(pendingBrewTypeSignal.value).toBe("Aeropress");
    });

    it("leaves the pending brew type null when the calculator's chooser picked the quick-calculator sentinel", () => {
      selectBrewType(QUICK_CALCULATOR);

      openSaveDialog();

      expect(pendingBrewTypeSignal.value).toBeNull();
    });

    it("leaves the pending brew type null when the calculator's chooser hasn't been answered yet", () => {
      expect(selectedBrewTypeSignal.value).toBeNull();

      openSaveDialog();

      expect(pendingBrewTypeSignal.value).toBeNull();
    });

    it("sets the intent to share when requested", () => {
      openSaveDialog({ intent: "share" });

      expect(saveIntentSignal.value).toBe("share");
    });

    it("sets the intent to guided-timer when requested", () => {
      openSaveDialog({ intent: "guided-timer" });

      expect(saveIntentSignal.value).toBe("guided-timer");
    });

    it("resets and re-enables saveDialogOpenSignal even if called when already true", () => {
      openSaveDialog({ intent: "guided-timer" });
      expect(saveDialogOpenSignal.value).toBe(true);

      openSaveDialog({ intent: "guided-timer" });
      expect(saveDialogOpenSignal.value).toBe(true);
    });
  });

  describe("cancelSaveDialog", () => {
    it("closes the sheet and resets the intent back to save", () => {
      openSaveDialog({ intent: "share" });

      cancelSaveDialog();

      expect(saveDialogOpenSignal.value).toBe(false);
      expect(saveIntentSignal.value).toBe("save");
    });

    it("resets a guided-timer intent back to save too", () => {
      openSaveDialog({ intent: "guided-timer" });

      cancelSaveDialog();

      expect(saveIntentSignal.value).toBe("save");
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

      const result = await confirmSave();

      expect(result).toBeNull();
      expect(savedBrewsSignal.value).toHaveLength(0);
    });

    it("returns null and saves nothing when there's no computed coffee amount", async () => {
      selectPendingBrewType("Pour-over");

      const result = await confirmSave();

      expect(result).toBeNull();
      expect(savedBrewsSignal.value).toHaveLength(0);
    });

    it("saves the brew with an undefined name when left blank, and returns intent 'save' with no share outcome", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");

      const result = await confirmSave();

      expect(result).not.toBeNull();
      expect(result?.intent).toBe("save");
      expect(result?.shareOutcome).toBeNull();
      expect(result?.savedBrew).toBe(savedBrewsSignal.value[0]);
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

    it("carries the live brewStepsSignal/loadedRecipeSourceSignal into the saved brew", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "X", kind: "note", value: "y" }],
      };
      const recipeSource: ILoadedRecipeSource = {
        recipeId: "2025-1",
        label: "Némo Pop · 2025, 1st place",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        steps: brewSteps.steps,
      };
      setWater("480");
      selectBrewType("Aeropress");
      updateBrewStepsConfig(brewSteps);
      loadedRecipeSourceSignal.value = recipeSource;
      selectPendingBrewType("Aeropress");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.brewSteps).toEqual(brewSteps);
      expect(savedBrewsSignal.value[0]?.recipeSource).toEqual(recipeSource);
    });

    it("omits brewSteps/recipeSource when neither is set for the session", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.brewSteps).toBeUndefined();
      expect(savedBrewsSignal.value[0]?.recipeSource).toBeUndefined();
    });

    it("drops brewSteps/recipeSource when the Save sheet's pending type was changed away from the Calculator's selected type", async () => {
      const brewSteps: IBrewStepsConfig = {
        steps: [{ id: "x", label: "X", kind: "note", value: "y" }],
      };
      const recipeSource: ILoadedRecipeSource = {
        recipeId: "2025-1",
        label: "Némo Pop · 2025, 1st place",
        ratio: 9.44,
        water: 170,
        coffee: 18,
        steps: brewSteps.steps,
      };
      setWater("480");
      // Calculator's own chooser picked Aeropress and loaded a WAC recipe...
      selectBrewType("Aeropress");
      updateBrewStepsConfig(brewSteps);
      loadedRecipeSourceSignal.value = recipeSource;
      // ...but the Save sheet's own type picker was then changed to something else.
      selectPendingBrewType("Kalita Wave");

      await confirmSave();

      expect(savedBrewsSignal.value[0]?.brewType).toBe("Kalita Wave");
      expect(savedBrewsSignal.value[0]?.brewSteps).toBeUndefined();
      expect(savedBrewsSignal.value[0]?.recipeSource).toBeUndefined();
    });

    it("closes the sheet and resets the intent back to save after saving", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");
      saveDialogOpenSignal.value = true;

      await confirmSave();

      expect(saveDialogOpenSignal.value).toBe(false);
      expect(saveIntentSignal.value).toBe("save");
    });

    it("resets the calculator's entered numbers after a plain save", async () => {
      setWater("480");
      selectPendingBrewType("Pour-over");

      await confirmSave();

      expect(waterSignal.value).toBe("");
      expect(ozSignal.value).toBe("");
      expect(coffeeSignal.value).toBeNull();
      expect(ratioSignal.value).toBe("16");
    });

    describe("with an Espresso Shot source", () => {
      it("sources coffee/ratio/water/oz from the espresso store instead of the pour-over signals", async () => {
        selectBrewType("Espresso Shot");
        setEspressoDoseIn("20");
        setEspressoRatio("2.5");
        selectPendingBrewType("Espresso Shot");
        const expectedDoseIn = espressoDoseInSignal.value;
        const expectedRatio = espressoRatioSignal.value;
        const expectedDoseOut = espressoDoseOutSignal.value;

        await confirmSave();

        const saved = savedBrewsSignal.value[0];
        expect(saved.brewType).toBe("Espresso Shot");
        expect(saved.coffee).toBe(expectedDoseIn);
        expect(saved.ratio).toBe(expectedRatio);
        expect(saved.water).toBe(expectedDoseOut);
        expect(saved.oz).toBeCloseTo(expectedDoseOut * 0.035274, 2);
      });

      it("still saves when the espresso dose-in is 0, since 0 is a valid coffee amount, not the 'unset' null sentinel", async () => {
        selectBrewType("Espresso Shot");
        setEspressoDoseIn("0");
        selectPendingBrewType("Espresso Shot");

        const result = await confirmSave();

        expect(result).not.toBeNull();
        expect(savedBrewsSignal.value).toHaveLength(1);
        expect(savedBrewsSignal.value[0]?.coffee).toBe(0);
      });

      it("resets the espresso calculator (not the pour-over signals) after a plain save", async () => {
        selectBrewType("Espresso Shot");
        setEspressoDoseIn("20");
        setEspressoDoseOut("50");
        selectPendingBrewType("Espresso Shot");

        await confirmSave();

        expect(espressoDoseInSignal.value).toBe(18);
        expect(espressoRatioSignal.value).toBe(2);
        expect(espressoDoseOutSignal.value).toBe(36);
      });

      it("does not regress the pour-over path: a non-espresso save still sources numbers from the shared calculator signals", async () => {
        setWater("480");
        selectPendingBrewType("Pour-over");

        await confirmSave();

        const saved = savedBrewsSignal.value[0];
        expect(saved.coffee).toBe(30);
        expect(saved.water).toBe(480);
        expect(saved.ratio).toBe(16);
      });
    });

    describe("when the Save sheet's pending type diverges from the Calculator's active flow", () => {
      it("sources coffee/ratio/water from the espresso store when relabeled to Espresso Shot, even though the pour-over flow is the one active", async () => {
        // Pour-over flow is active with real entered numbers...
        selectBrewType("Pour-over");
        setWater("480");
        // ...and the espresso store separately holds its own (different) numbers.
        setEspressoDoseIn("20");
        setEspressoRatio("2.5");
        // The Save sheet's own picker is then relabeled to Espresso Shot.
        selectPendingBrewType("Espresso Shot");

        await confirmSave();

        const saved = savedBrewsSignal.value[0];
        expect(saved.brewType).toBe("Espresso Shot");
        expect(saved.coffee).toBe(20);
        expect(saved.ratio).toBe(2.5);
        expect(saved.water).toBe(50);
      });

      it("sources coffee/ratio/water from the shared calculator signals when relabeled to a pour-over type, even though the espresso flow is the one active", async () => {
        // Pour-over signals separately hold their own (different) numbers...
        setWater("480");
        // ...and the espresso flow is the one actually active, with its own numbers.
        selectBrewType("Espresso Shot");
        setEspressoDoseIn("20");
        setEspressoRatio("2.5");
        // The Save sheet's own picker is then relabeled to a pour-over type.
        selectPendingBrewType("Pour-over");

        await confirmSave();

        const saved = savedBrewsSignal.value[0];
        expect(saved.brewType).toBe("Pour-over");
        expect(saved.coffee).toBe(30);
        expect(saved.ratio).toBe(16);
        expect(saved.water).toBe(480);
      });

      it("still resets the active pour-over flow's own signals after save, not the espresso store, when saved-as diverges to Espresso Shot", async () => {
        selectBrewType("Pour-over");
        setWater("480");
        setEspressoDoseIn("20");
        setEspressoRatio("2.5");
        selectPendingBrewType("Espresso Shot");

        await confirmSave();

        expect(waterSignal.value).toBe("");
        expect(coffeeSignal.value).toBeNull();
        expect(ratioSignal.value).toBe("16");
        // The espresso store wasn't the active flow, so it's left untouched.
        expect(espressoDoseInSignal.value).toBe(20);
        expect(espressoRatioSignal.value).toBe(2.5);
      });

      it("still resets the active espresso flow's own signals after save, not the pour-over signals, when saved-as diverges to a pour-over type", async () => {
        setWater("480");
        selectBrewType("Espresso Shot");
        setEspressoDoseIn("20");
        setEspressoRatio("2.5");
        selectPendingBrewType("Pour-over");

        await confirmSave();

        expect(espressoDoseInSignal.value).toBe(18);
        expect(espressoRatioSignal.value).toBe(2);
        expect(espressoDoseOutSignal.value).toBe(36);
        // The pour-over signals weren't the active flow, so they're left untouched.
        expect(waterSignal.value).toBe("480");
        expect(coffeeSignal.value).toBe(30);
      });
    });

    describe("with the share intent", () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      beforeEach(() => {
        writeText.mockClear();
        vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it("returns intent 'share' with a shareOutcome instead of null", async () => {
        setWater("480");
        selectPendingBrewType("Pour-over");
        openSaveDialog({ intent: "share" });
        selectPendingBrewType("Pour-over");

        const result = await confirmSave();

        expect(result?.intent).toBe("share");
        expect(result?.shareOutcome).toBe("copied");
        expect(writeText).toHaveBeenCalledTimes(1);
      });

      it("resets the calculator's entered numbers after a share save", async () => {
        setWater("480");
        openSaveDialog({ intent: "share" });
        selectPendingBrewType("Pour-over");

        await confirmSave();

        expect(waterSignal.value).toBe("");
        expect(ozSignal.value).toBe("");
        expect(coffeeSignal.value).toBeNull();
        expect(ratioSignal.value).toBe("16");
      });
    });

    describe("with the guided-timer intent", () => {
      it("returns intent 'guided-timer' without calling share", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

        setWater("480");
        openSaveDialog({ intent: "guided-timer" });
        selectPendingBrewType("Pour-over");

        const result = await confirmSave();

        expect(result?.intent).toBe("guided-timer");
        expect(result?.shareOutcome).toBeNull();
        expect(writeText).not.toHaveBeenCalled();

        vi.unstubAllGlobals();
      });

      it("does not reset the calculator's entered numbers, to avoid a blank-field flash before the /timer navigation resolves", async () => {
        setWater("480");
        openSaveDialog({ intent: "guided-timer" });
        selectPendingBrewType("Pour-over");

        await confirmSave();

        expect(waterSignal.value).toBe("480");
        expect(ozSignal.value).not.toBe("");
        expect(coffeeSignal.value).not.toBeNull();
        expect(ratioSignal.value).toBe("16");
      });
    });
  });
});
