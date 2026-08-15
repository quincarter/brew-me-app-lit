import type { IEspressoShotStyle } from "../interfaces/brew.interface";

/**
 * Standard named espresso pull styles - fixed dose/ratio/yield/shot-time
 * combinations with no machine-specific technique of their own (see
 * `ESPRESSO_PROFILES` for those). Drives the "Standard recipes" section of
 * the Espresso Recipes screen and the espresso branch of
 * `RecipePickerSheet`.
 */
export const ESPRESSO_SHOT_STYLES: IEspressoShotStyle[] = [
  {
    id: "ristretto",
    label: "Ristretto",
    ratio: 1.3,
    doseIn: 18,
    doseOut: 23,
    shotTimeSec: 22,
    blurb: "Ristretto — 1:1–1.5, 20–25s, concentrated and syrupy.",
  },
  {
    id: "single",
    label: "Single",
    ratio: 2,
    doseIn: 9,
    doseOut: 18,
    shotTimeSec: 25,
    blurb: "Single — 1:2, 20–25s, a single-basket pull.",
  },
  {
    id: "double",
    label: "Double",
    ratio: 2,
    doseIn: 18,
    doseOut: 36,
    shotTimeSec: 28,
    blurb: "Double — 1:2, 25–30s, the everyday standard.",
  },
  {
    id: "lungo",
    label: "Lungo",
    ratio: 3.5,
    doseIn: 18,
    doseOut: 63,
    shotTimeSec: 38,
    blurb: "Lungo — 1:3–4, 35–40s, longer and milder.",
  },
  {
    id: "triple",
    label: "Triple",
    ratio: 2,
    doseIn: 21,
    doseOut: 42,
    shotTimeSec: 30,
    blurb: "Triple — 1:2, 28–32s, bigger basket, more body.",
  },
  {
    id: "ristretto-lungo",
    label: "Ristretto Lungo",
    ratio: 1.8,
    doseIn: 18,
    doseOut: 32,
    shotTimeSec: 30,
    blurb: "Ristretto Lungo — 1:1.5–2, 28–32s, restricted flow pulled long.",
  },
  {
    id: "zuppa",
    label: "Zuppa",
    ratio: 1,
    doseIn: 18,
    doseOut: 18,
    shotTimeSec: 17,
    blurb: "Zuppa — about 1:1, 15–20s, the shortest and most intense pull.",
  },
];
