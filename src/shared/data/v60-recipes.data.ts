import type { IV60Recipe } from "../interfaces/brew.interface";

/** Where this content came from - surfaced in the UI so credit links back to the source. */
export const V60_RECIPES_SOURCE = {
  name: "Pour Over Project",
  url: "https://pouroverproject.com/v60-recipes-rao-hoffman-kasuya-drip-coffee/",
};

/**
 * Five well-known V60 recipes transcribed from the Pour Over Project
 * roundup (see V60_RECIPES_SOURCE): three from named coffee experts (Rao,
 * Hoffmann, Kasuya) plus two brand/manufacturer recipes (Intelligentsia,
 * Hario) that the same roundup covers. Every recipe is a single cup, dialed
 * in by its author for their own setup - treat them as starting points.
 */
export const V60_RECIPES: IV60Recipe[] = [
  {
    id: "rao",
    author: "Scott Rao",
    title: "Spin to Win",
    setup: {
      Dose: "22g",
      Water: "360g",
      Ratio: "1:16.4",
      "Brew time": "3:00",
    },
    steps: [
      "Rinse the filter and pre-heat the V60.",
      "Add the grounds, level them, then pre-wet with 66g of water (about 3x the coffee weight).",
      "Gently stir/excavate so every ground is wet within the first 10 seconds.",
      "At 0:45, start the main pour, filling to 360g total.",
      "Gently stir to knock any grounds clinging to the walls back into the slurry.",
      "At 1:45, swirl the V60 to flatten the coffee bed.",
      "Drawdown should finish by the 3-minute mark.",
    ],
    note: "Rao strongly recommends a plastic V60 over ceramic or glass for better heat retention.",
  },
  {
    id: "hoffmann",
    author: "James Hoffmann",
    title: "Turning the Heat Up",
    setup: {
      Dose: "30g",
      Water: "500g",
      Ratio: "1:16.7",
      Grind: "Medium-fine",
      "Brew time": "3:30",
    },
    steps: [
      "Rinse the filter and pre-heat the V60.",
      "Add the grounds and create a well in the middle of the bed.",
      "Pre-wet with 60g of water (about 2x the coffee weight).",
      "Swirl the brewer until the slurry looks even.",
      "At 0:45, pour to 300g over the next 30 seconds.",
      "At 1:15, gently pour to 500g over the next 30 seconds.",
      "Stir gently, clockwise then anticlockwise.",
      "Gently swirl again to flatten the coffee bed.",
      "Drawdown should finish by 3:30.",
    ],
    note: "Hoffmann emphasizes a good pouring kettle, soft water, and a quality burr grinder as much as the recipe itself.",
  },
  {
    id: "kasuya",
    author: "Tetsu Kasuya",
    title: "The 4:6 Method",
    setup: {
      Dose: "20g",
      Water: "300g",
      Ratio: "1:15",
      Grind: "Coarse",
    },
    steps: [
      "Rinse the filter and pre-heat the V60.",
      "Add the 20g of coarsely-ground coffee.",
      "Pour 5 times, 60g of water each, waiting 45 seconds between pours, for 300g total.",
      "The first 40% of water (the first two pours) controls the sweetness/acidity balance: a smaller first pour tilts sweeter, a larger one tilts more acidic - adjust the second pour to compensate.",
      "The remaining 60% (pours 3-5) controls strength: two 90g pours brews weaker, four 45g pours brews stronger.",
    ],
    note: '"The first 40% adjusts the balance between sweetness and acidity, while the next 60% controls the strength." - Tetsu Kasuya',
  },
  {
    id: "intelligentsia",
    author: "Intelligentsia Coffee",
    title: "Intelligentsia's V60 Recipe",
    setup: {
      Dose: "26g",
      Water: "468g",
      Ratio: "1:18",
      Grind: "Fine (sand-like)",
      "Brew time": "4:00",
    },
    steps: [
      "Rinse the filter and pre-heat the V60.",
      "Add the 26g of coffee.",
      "Pour 52g of water (2x the coffee weight) in a clockwise spiral from the center outward; let it sit for about a minute.",
      "Continue pouring 70-100g at a time, waiting 10-12 seconds between pours, keeping the pour concentrated toward the center.",
      "Stop once the target weight is reached and let it drip down to occasional drops before removing the dripper.",
    ],
  },
  {
    id: "hario",
    author: "Hario",
    title: "Hario's Recommended Recipe",
    setup: {
      Dose: "12g",
      Water: "120g",
      Ratio: "1:10",
      Grind: "Medium-fine",
      Temp: "Boiling",
      "Brew time": "3:00",
    },
    steps: [
      "Fold the filter paper, place it in the dripper, and rinse it with boiling water to warm everything up.",
      "Add the 12g of coffee and shake the V60 lightly to level the bed.",
      "Pour boiling water from the center outward in a spiral; let it pre-wet for 30 seconds.",
      "Pour the remaining water with the same spiral motion, avoiding pouring directly onto the filter paper.",
      "Remove the dripper once brewing finishes.",
    ],
    note: "Hario's own materials list this as a 1:12 ratio, but 12g of coffee to 120g of water actually works out to 1:10.",
  },
];
