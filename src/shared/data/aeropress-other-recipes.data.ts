import type { IAeropressExpertRecipe } from "../interfaces/brew.interface";

/** Where this content came from - surfaced in the UI so credit links back to the source. */
export const AEROPRESS_OTHER_RECIPES_SOURCE = {
  name: "Gota",
  url: "https://gota.cafe/en/recipes/aeropress/hedrick-zuppa-lunga",
};

/**
 * Named-creator AeroPress recipes that aren't World AeroPress Championship
 * entries (see `AEROPRESS_RECIPES`) - a home for recipes like Lance
 * Hedrick's espresso-style "Zuppa" adaptations, which need a portafilter
 * valve-cap attachment a stock AeroPress doesn't have, so they'd never fit
 * the championship archive.
 */
export const AEROPRESS_OTHER_RECIPES: IAeropressExpertRecipe[] = [
  {
    id: "lance-hedrick-zuppa-lunga",
    author: "Lance Hedrick",
    title: "Zuppa Lunga",
    setup: {
      Dose: "15g",
      Water: "150g",
      Ratio: "1:10",
      Temperature: "95°C",
      Grind: "Medium-coarse",
      Equipment:
        "Portafilter valve-cap attachment (Joe Presso, Fellow Prismo, or AeroPress Flow Control Filter Cap) — required",
      "Total Time": "0:50",
    },
    steps: [
      "Fit a portafilter valve-cap attachment in place of the stock AeroPress cap — a stock cap can't hold back the pressure this recipe needs.",
      "Dose 15g of medium-coarse coffee into the basket and tamp the puck, just like espresso.",
      "Pour 150g of 95°C water gently over about 7 seconds, filling completely.",
      "Tap the side of the brewer a few times to knock any grounds off the wall.",
      "Insert the plunger to create a vacuum seal.",
      "Press down slowly over about 35 seconds — stop just before the hiss for a cleaner cup, or push through fully for more yield.",
      "Yields roughly 131g at about 2.0% TDS and 17% extraction.",
    ],
    note: "Requires a portafilter valve-cap attachment with a built-in shower screen — Joe Presso, Fellow Prismo, or the AeroPress Flow Control Filter Cap. A stock AeroPress cap won't work: the kettle stream hits the puck too hard, and liquid escapes the gasket during the press. Joe Presso is Hedrick's preferred option, since its sealed shower screen avoids the bypass Prismo's edge slots can cause. A paper filter on top is optional — the shower screen alone is usually enough.",
    timedSteps: [
      {
        id: "lance-hedrick-zuppa-lunga-pour",
        label: "Pour",
        kind: "timed",
        seconds: 7,
        note: "Pour 150g of 95°C water gently, filling completely",
      },
      {
        id: "lance-hedrick-zuppa-lunga-swirl",
        label: "Swirl",
        kind: "timed",
        seconds: 5,
        note: "Tap the side to knock grounds off the wall",
      },
      {
        id: "lance-hedrick-zuppa-lunga-prepare",
        label: "Prepare",
        kind: "timed",
        seconds: 3,
        note: "Insert the plunger to create a vacuum seal",
      },
      {
        id: "lance-hedrick-zuppa-lunga-press",
        label: "Press",
        kind: "timed",
        seconds: 35,
        note: "Press down slowly — stop just before the hiss for a cleaner cup, or push through fully for more yield",
      },
    ],
  },
];
