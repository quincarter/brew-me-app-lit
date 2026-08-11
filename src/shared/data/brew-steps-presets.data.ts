import type { IBrewStepsConfig } from "../interfaces/brew.interface";

/**
 * Canned step sequences for brew types with a real method to walk through,
 * keyed by the same brew type string used everywhere else (`BREW_TYPES`,
 * `BREW_GUIDE`, `ISavedBrew.brewType`). Selecting a brew type on the
 * Calculator seeds `brewStepsSignal` from here; a type with no entry (Cold
 * Brew, Espresso Shot, Drip, any custom type) gets no Brew Steps
 * card at all, keeping the plain calculating flow untouched for them.
 */
export const BREW_STEPS_PRESETS: Record<string, IBrewStepsConfig> = {
  Aeropress: {
    steps: [
      { id: "aeropress-setup-position", label: "Position", kind: "note", value: "Standard" },
      { id: "aeropress-setup-grind", label: "Grind", kind: "note", value: "Medium-fine" },
      { id: "aeropress-setup-temp", label: "Temp", kind: "note", value: "175–185°F" },
      { id: "aeropress-setup-filter", label: "Filter", kind: "note", value: "Paper" },
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
    ],
  },
  "Hario Switch": {
    steps: [
      { id: "switch-setup-grind", label: "Grind", kind: "note", value: "Medium" },
      { id: "switch-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "switch-setup-filter", label: "Filter", kind: "note", value: "Paper" },
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
      { id: "clever-setup-grind", label: "Grind", kind: "note", value: "Medium" },
      { id: "clever-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "clever-setup-filter", label: "Filter", kind: "note", value: "Paper" },
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
      { id: "v60-setup-grind", label: "Grind", kind: "note", value: "Medium" },
      { id: "v60-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "v60-setup-filter", label: "Filter", kind: "note", value: "Paper" },
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
      { id: "chemex-setup-grind", label: "Grind", kind: "note", value: "Medium-coarse" },
      { id: "chemex-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "chemex-setup-filter", label: "Filter", kind: "note", value: "Chemex paper" },
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
      { id: "kalita-setup-grind", label: "Grind", kind: "note", value: "Medium" },
      { id: "kalita-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "kalita-setup-filter", label: "Filter", kind: "note", value: "Wave paper" },
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
  Origami: {
    steps: [
      { id: "origami-setup-grind", label: "Grind", kind: "note", value: "Medium" },
      { id: "origami-setup-temp", label: "Temp", kind: "note", value: "200°F" },
      { id: "origami-setup-filter", label: "Filter", kind: "note", value: "Conical paper" },
      {
        id: "origami-bloom",
        label: "Bloom",
        kind: "timed",
        seconds: 40,
        note: "Wet grounds evenly, gentle swirl",
      },
      {
        id: "origami-pulse-1",
        label: "First pulse",
        kind: "timed",
        seconds: 45,
        note: "Slow center-out spiral pour",
      },
      {
        id: "origami-pulse-2",
        label: "Second pulse",
        kind: "timed",
        seconds: 45,
        note: "Pour into center to target weight",
      },
      {
        id: "origami-drawdown",
        label: "Draw down",
        kind: "timed",
        seconds: null,
        note: "Gentle swirl to level bed, let drain",
      },
    ],
  },
  "French Press": {
    steps: [
      { id: "frenchpress-setup-grind", label: "Grind", kind: "note", value: "Coarse" },
      { id: "frenchpress-setup-temp", label: "Temp", kind: "note", value: "200°F" },
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
