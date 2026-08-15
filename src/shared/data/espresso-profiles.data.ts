import type { IEspressoProfile } from "../interfaces/brew.interface";

/**
 * Named espresso techniques/profiles - each carries its own preinfusion
 * time, grind, and water temp since the technique itself is the point, not
 * just the ratio (see `ESPRESSO_SHOT_STYLES` for the plain named pull
 * styles). Drives the "Shot profiles" section of the Espresso Recipes
 * screen and the espresso branch of `RecipePickerSheet`.
 *
 * The source mockup's "Standard Double" profile is intentionally omitted
 * here - it duplicates `ESPRESSO_SHOT_STYLES`'s "Double" entry.
 */
export const ESPRESSO_PROFILES: IEspressoProfile[] = [
  {
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
  },
  {
    id: "turbo-shot",
    name: "Turbo Shot",
    ratio: 3,
    doseIn: 18,
    doseOut: 54,
    shotTimeSec: 18,
    preinfusionSec: 0,
    grind: "Slightly coarser",
    waterTemp: "205°F",
    tagline: "Fast, high-flow, lighter body — popular for light-roast filter-style beans.",
  },
  {
    id: "ristretto-profile",
    name: "Ristretto Profile",
    ratio: 1.3,
    doseIn: 18,
    doseOut: 23,
    shotTimeSec: 22,
    preinfusionSec: 5,
    grind: "Fine",
    waterTemp: "200°F",
    tagline: "Concentrated and syrupy, pulled short.",
  },
  {
    id: "lungo-profile",
    name: "Lungo Profile",
    ratio: 3.5,
    doseIn: 18,
    doseOut: 63,
    shotTimeSec: 38,
    preinfusionSec: 5,
    grind: "Fine",
    waterTemp: "200°F",
    tagline: "Pulled long for a bigger, milder cup.",
  },
  {
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
  },
  {
    id: "decline-shot",
    name: "Decline Shot",
    ratio: 2,
    doseIn: 18,
    doseOut: 36,
    shotTimeSec: 32,
    preinfusionSec: 8,
    grind: "Fine",
    waterTemp: "200°F",
    tagline: "Pressure eases off through the pull — best on machines with pressure profiling.",
  },
];
