import { describe, expect, it } from "vitest";
import type { IEspressoProfile, IEspressoShotStyle } from "../../interfaces/brew.interface";
import {
  buildEspressoSteps,
  ESPRESSO_STYLE_DEFAULT_GRIND,
  ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
  ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
  getEspressoRecipeLabel,
  getEspressoRecipeSteps,
} from "../espresso-recipe.utility";

const shotStyle: IEspressoShotStyle = {
  id: "double",
  label: "Double",
  ratio: 2,
  doseIn: 18,
  doseOut: 36,
  shotTimeSec: 28,
  blurb: "Double — 1:2, 25–30s, the everyday standard.",
};

const profile: IEspressoProfile = {
  id: "blooming-espresso",
  name: "Blooming Espresso",
  ratio: 2,
  doseIn: 18,
  doseOut: 36,
  shotTimeSec: 30,
  preinfusionSec: 10,
  grind: "Fine",
  waterTemp: "200°F",
  tagline: "A gentle pre-wet before the pull, like a mini bloom for the puck.",
};

const profileWithNote: IEspressoProfile = {
  id: "allonge",
  name: "Allongé",
  ratio: 2.5,
  doseIn: 18,
  doseOut: 45,
  shotTimeSec: 28,
  preinfusionSec: 5,
  grind: "Fine",
  waterTemp: "200°F",
  tagline: "A shot lengthened with hot water after pulling, French-café style.",
  note: "Pull as a standard double, then top with hot water to taste.",
};

describe("espresso-recipe.utility", () => {
  describe("buildEspressoSteps", () => {
    it("produces the 4 canonical rows with correct ids, labels, kinds, and values", () => {
      const steps = buildEspressoSteps(8, 30, "Medium-fine", "203°F");

      expect(steps).toEqual([
        { id: "espresso-grind", label: "Grind", kind: "note", value: "Medium-fine" },
        { id: "espresso-temp", label: "Water temp", kind: "note", value: "203°F" },
        { id: "espresso-preinfusion", label: "Preinfusion", kind: "timed", seconds: 8 },
        { id: "espresso-shot", label: "Shot time", kind: "timed", seconds: 30 },
      ]);
    });

    it("carries a zero preinfusion through as a real timed row rather than dropping it", () => {
      const steps = buildEspressoSteps(0, 18, "Slightly coarser", "205°F");

      expect(steps[2]).toEqual({
        id: "espresso-preinfusion",
        label: "Preinfusion",
        kind: "timed",
        seconds: 0,
      });
    });
  });

  describe("getEspressoRecipeLabel", () => {
    it("returns .label for a plain shot style", () => {
      expect(getEspressoRecipeLabel(shotStyle)).toBe("Double");
    });

    it("returns .name for a technique profile", () => {
      expect(getEspressoRecipeLabel(profile)).toBe("Blooming Espresso");
    });
  });

  describe("getEspressoRecipeSteps", () => {
    it("for a plain shot style, fills grind/temp/preinfusion with the style-wide defaults and uses the style's own shotTimeSec", () => {
      const steps = getEspressoRecipeSteps(shotStyle);

      expect(steps).toEqual([
        { id: "espresso-grind", label: "Grind", kind: "note", value: ESPRESSO_STYLE_DEFAULT_GRIND },
        {
          id: "espresso-temp",
          label: "Water temp",
          kind: "note",
          value: ESPRESSO_STYLE_DEFAULT_WATER_TEMP,
        },
        {
          id: "espresso-preinfusion",
          label: "Preinfusion",
          kind: "timed",
          seconds: ESPRESSO_STYLE_DEFAULT_PREINFUSION_SEC,
        },
        { id: "espresso-shot", label: "Shot time", kind: "timed", seconds: shotStyle.shotTimeSec },
      ]);
    });

    it("for a profile, uses its own preinfusion/grind/water temp rather than the style-wide defaults", () => {
      const steps = getEspressoRecipeSteps(profile);

      expect(steps).toEqual([
        { id: "espresso-grind", label: "Grind", kind: "note", value: "Fine" },
        { id: "espresso-temp", label: "Water temp", kind: "note", value: "200°F" },
        { id: "espresso-preinfusion", label: "Preinfusion", kind: "timed", seconds: 10 },
        { id: "espresso-shot", label: "Shot time", kind: "timed", seconds: 30 },
      ]);
    });

    it("a profile whose own values differ from the style defaults produces steps that reflect its own values, not the defaults", () => {
      const steps = getEspressoRecipeSteps(profileWithNote);

      expect(steps).toEqual(
        buildEspressoSteps(
          profileWithNote.preinfusionSec,
          profileWithNote.shotTimeSec,
          profileWithNote.grind,
          profileWithNote.waterTemp,
        ),
      );
    });
  });
});
