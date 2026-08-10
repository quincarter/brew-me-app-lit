import type { IBrewStepsConfig } from "../interfaces/brew.interface";

/**
 * Canned step sequences for brew types with a real method to walk through,
 * keyed by the same brew type string used everywhere else (`BREW_TYPES`,
 * `BREW_GUIDE`, `ISavedBrew.brewType`). Selecting a brew type on the
 * Calculator seeds `brewStepsSignal` from here; a type with no entry (Cold
 * Brew, Espresso Shot, Drip, Origami, any custom type) gets no Brew Steps
 * card at all, keeping the plain calculating flow untouched for them.
 */
export const BREW_STEPS_PRESETS: Record<string, IBrewStepsConfig> = {
  Aeropress: {
    steps: [
      {
        id: "aeropress-bloom",
        label: "Bloom",
        kind: "timed",
        seconds: 30,
        note: "Wet all grounds, gentle swirl",
      },
      {
        id: "aeropress-steep",
        label: "Steep",
        kind: "timed",
        seconds: 60,
        note: "Stir 2x, let sit",
      },
      {
        id: "aeropress-plunge",
        label: "Plunge",
        kind: "timed",
        seconds: 20,
        note: "Slow, steady press",
      },
      { id: "aeropress-filter", label: "Filter", kind: "note", value: "Paper" },
    ],
  },
  "Hario Switch": {
    steps: [
      {
        id: "switch-steep",
        label: "Switch closed — steep",
        kind: "timed",
        seconds: 90,
        note: "Full immersion phase",
      },
      {
        id: "switch-drip",
        label: "Switch open — drip",
        kind: "timed",
        seconds: 120,
        note: "Reminder to flip it",
      },
    ],
  },
  "Clever Dripper": {
    steps: [
      {
        id: "clever-steep",
        label: "Steep",
        kind: "timed",
        seconds: 180,
        note: "Lid off, full immersion",
      },
      {
        id: "clever-agitate",
        label: "Agitate",
        kind: "timed",
        seconds: 90,
        note: "Optional stir reminder",
      },
      {
        id: "clever-release",
        label: "Release onto cup",
        kind: "timed",
        seconds: null,
        note: "Set dripper down",
      },
    ],
  },
  V60: {
    steps: [
      {
        id: "v60-bloom",
        label: "Bloom",
        kind: "timed",
        seconds: 30,
        note: "Wet grounds, let de-gas",
      },
      {
        id: "v60-pour-1",
        label: "Pour 1",
        kind: "timed",
        seconds: 45,
        note: "Slow center-out spiral",
      },
      {
        id: "v60-pour-2",
        label: "Pour 2",
        kind: "timed",
        seconds: 45,
        note: "Second pour to target weight",
      },
      {
        id: "v60-drawdown",
        label: "Draw down",
        kind: "timed",
        seconds: null,
        note: "Let water fully drain",
      },
    ],
  },
  Chemex: {
    steps: [
      {
        id: "chemex-bloom",
        label: "Bloom",
        kind: "timed",
        seconds: 45,
        note: "Larger grounds bed, wet evenly",
      },
      {
        id: "chemex-pour",
        label: "Pour",
        kind: "timed",
        seconds: 150,
        note: "Slow, steady pours in stages",
      },
      {
        id: "chemex-drawdown",
        label: "Draw down",
        kind: "timed",
        seconds: null,
        note: "Filter runs slower than V60",
      },
    ],
  },
  "Kalita Wave": {
    steps: [
      {
        id: "kalita-bloom",
        label: "Bloom",
        kind: "timed",
        seconds: 30,
        note: "Flat bed, even saturation",
      },
      {
        id: "kalita-pulse-pours",
        label: "Pulse pours",
        kind: "timed",
        seconds: 120,
        note: "3–4 small pours to keep the bed level",
      },
      {
        id: "kalita-drawdown",
        label: "Draw down",
        kind: "timed",
        seconds: null,
        note: "Should finish evenly across the bed",
      },
    ],
  },
  "French Press": {
    steps: [
      {
        id: "frenchpress-steep",
        label: "Steep",
        kind: "timed",
        seconds: 240,
        note: "Coarse grounds, full immersion",
      },
      {
        id: "frenchpress-plunge",
        label: "Plunge",
        kind: "timed",
        seconds: null,
        note: "Press slowly, straight down",
      },
    ],
  },
};
