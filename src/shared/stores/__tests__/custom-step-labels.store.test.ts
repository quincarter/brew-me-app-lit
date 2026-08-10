import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { BREW_STEPS_PRESETS } from "../../data/brew-steps-presets.data";
import {
  PRESET_STEP_LABELS,
  addCustomStepLabel,
  customStepLabelsSignal,
  knownStepLabelsSignal,
} from "../custom-step-labels.store";

describe("custom-step-labels.store", () => {
  beforeEach(() => {
    customStepLabelsSignal.value = [];
  });

  describe("PRESET_STEP_LABELS", () => {
    it("collects every canned step label across BREW_STEPS_PRESETS, deduped", () => {
      const allLabels = Object.values(BREW_STEPS_PRESETS).flatMap((config) =>
        config.steps.map((step) => step.label),
      );

      expect(PRESET_STEP_LABELS).toEqual([...new Set(allLabels)]);
      // "Bloom" appears in multiple presets (Aeropress, V60, Chemex, Kalita
      // Wave), so a correctly-deduped list should still only contain it once.
      expect(PRESET_STEP_LABELS.filter((label) => label === "Bloom")).toHaveLength(1);
    });
  });

  describe("knownStepLabelsSignal", () => {
    it("is just the preset labels when nothing custom has been added", () => {
      expect(knownStepLabelsSignal.value).toEqual(PRESET_STEP_LABELS);
    });

    it("appends custom labels after the preset ones, in the order they were added", () => {
      addCustomStepLabel("Cupping");
      addCustomStepLabel("Rest");

      expect(knownStepLabelsSignal.value).toEqual([...PRESET_STEP_LABELS, "Cupping", "Rest"]);
    });
  });

  describe("addCustomStepLabel", () => {
    it("adds a new, trimmed label and returns it", () => {
      const result = addCustomStepLabel("  Cupping  ");

      expect(result).toBe("Cupping");
      expect(customStepLabelsSignal.value).toEqual(["Cupping"]);
    });

    it("returns null and adds nothing for a blank/whitespace-only label", () => {
      const result = addCustomStepLabel("   ");

      expect(result).toBeNull();
      expect(customStepLabelsSignal.value).toEqual([]);
    });

    it("case-insensitively dedupes against a preset label, returning the existing preset label", () => {
      const result = addCustomStepLabel("  bloom ");

      expect(result).toBe("Bloom");
      expect(customStepLabelsSignal.value).toEqual([]);
    });

    it("case-insensitively dedupes against an already-added custom label, without adding a duplicate", () => {
      addCustomStepLabel("Cupping");

      const result = addCustomStepLabel("CUPPING");

      expect(result).toBe("Cupping");
      expect(customStepLabelsSignal.value).toEqual(["Cupping"]);
    });
  });
});
