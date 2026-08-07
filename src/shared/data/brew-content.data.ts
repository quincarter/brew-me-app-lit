import type { IBrewGuideItem, IBrewVideo } from "../interfaces/brew.interface";

/** Brew type options offered when naming a saved ratio. */
export const BREW_TYPES: string[] = [
  "Aeropress",
  "Espresso Shot",
  "Chemex",
  "Cold Brew",
  "V60",
  "Kalita Wave",
  "Origami",
  "French Press",
  "Drip",
];

/**
 * Technique carries across conical/flat-bed pour-over brewers, so V60,
 * Chemex, Kalita Wave and Origami all share these two walkthroughs rather
 * than each duplicating its own list.
 */
const POUR_OVER_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "4tQG_aMcCL0",
    title: "Chemex Brew Guide — How to Hack and Brew Incredible Coffee on the Chemex",
    channel: "Lance Hedrick",
  },
  {
    youtubeId: "ikt-X5x7yoc",
    title: "The Chemex",
    channel: "James Hoffmann",
  },
];

const FRENCH_PRESS_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "st571DYYTR8",
    title: "James Hoffmann's Ultimate French Press Technique",
    channel: "James Hoffmann",
  },
  {
    youtubeId: "CYhYXF9NsbI",
    title: "Redeeming the French Press — A Modern French Press Recipe",
    channel: "Lance Hedrick",
  },
];

const AEROPRESS_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "CafyJ2p0Bgs",
    title: "A Very Good AeroPress Recipe, Maybe the Best",
    channel: "Lance Hedrick",
  },
];

/** Static brew method reference content shown on the More > Brew guide screens. */
export const BREW_GUIDE: IBrewGuideItem[] = [
  {
    id: "v60",
    name: "V60",
    desc: "The classic spiral-ridged pour-over — gives you full control over pour rate and extraction for a clean, bright cup.",
    ratioHint: "16:1",
    grind: "Medium",
    temp: "200°F",
    ratioDefault: 16,
    aiTips: [
      "Pour in slow concentric circles to keep extraction even.",
      "Let it bloom for 30–45 seconds before your main pour.",
    ],
    videos: POUR_OVER_VIDEOS,
  },
  {
    id: "chemex",
    name: "Chemex",
    desc: "Pour-over through a thick paper filter for an exceptionally clean, bright cup with heavier oils filtered out.",
    ratioHint: "16:1",
    grind: "Medium-coarse",
    temp: "200°F",
    ratioDefault: 16,
    aiTips: [
      "Rinse the filter first to remove papery taste.",
      "Pour in stages, keeping the bed evenly saturated.",
    ],
    videos: POUR_OVER_VIDEOS,
  },
  {
    id: "frenchpress",
    name: "French Press",
    desc: "Full immersion brewing through a metal mesh plunger — rich, heavy body with more sediment than filtered methods.",
    ratioHint: "15:1",
    grind: "Coarse",
    temp: "200°F",
    ratioDefault: 15,
    aiTips: [
      "Use a coarse grind to avoid sediment in your cup.",
      "Steep 4 minutes, then plunge slowly and evenly.",
    ],
    videos: FRENCH_PRESS_VIDEOS,
  },
  {
    id: "espresso",
    name: "Espresso Shot",
    desc: "Concentrated coffee pulled under pressure through a fine, compact puck — the base for lattes and cappuccinos.",
    ratioHint: "2:1",
    grind: "Fine",
    temp: "195–205°F",
    ratioDefault: 2,
    aiTips: [
      "Aim for a 25–30 second extraction time.",
      "A finer grind slows the shot; adjust in small steps.",
    ],
    videos: [],
  },
  {
    id: "coldbrew",
    name: "Cold Brew",
    desc: "Steeped in cold water for 12–24 hours for a smooth, low-acid concentrate — dilute with water or milk to taste.",
    ratioHint: "4:1",
    grind: "Coarse",
    temp: "Room temp / cold",
    ratioDefault: 4,
    aiTips: [
      "Steep longer (up to 24hrs) for a stronger concentrate.",
      "Dilute 1:1 with water or milk before drinking.",
    ],
    videos: [],
  },
  {
    id: "aeropress",
    name: "Aeropress",
    desc: "Fast, full-immersion brewing with light pressure — portable and forgiving, ready in under two minutes.",
    ratioHint: "15:1",
    grind: "Medium-fine",
    temp: "175–185°F",
    ratioDefault: 15,
    aiTips: [
      "Try the inverted method for a longer steep time.",
      "Press slowly over 20–30 seconds for a smoother cup.",
    ],
    videos: AEROPRESS_VIDEOS,
    recipesLink: {
      label: "World AeroPress Championship recipes",
      description: "Browse the winning competition recipes, year by year",
      route: "/more/aeropress-recipes",
    },
  },
  {
    id: "kalitawave",
    name: "Kalita Wave",
    desc: "A flat-bottomed pour-over that evens out extraction, making it more forgiving than conical drippers like the V60.",
    ratioHint: "16:1",
    grind: "Medium",
    temp: "200°F",
    ratioDefault: 16,
    aiTips: [
      "The flat bed means pour position matters less than on a V60.",
      "Keep pours steady to avoid channeling at the edges.",
    ],
    videos: POUR_OVER_VIDEOS,
  },
  {
    id: "origami",
    name: "Origami",
    desc: "A fluted, flexible pour-over dripper that adapts its flow rate depending on the filter paper you pair it with.",
    ratioHint: "15:1",
    grind: "Medium",
    temp: "200°F",
    ratioDefault: 15,
    aiTips: [
      "Pair with a conical filter for faster flow, flat for slower.",
      "Its ridges make it easy to swirl the slurry mid-pour.",
    ],
    videos: POUR_OVER_VIDEOS,
  },
  {
    id: "drip",
    name: "Drip",
    desc: "Automatic, hands-off brewing for a consistent daily cup with minimal effort — great for brewing multiple cups at once.",
    ratioHint: "16:1",
    grind: "Medium",
    temp: "195–200°F",
    ratioDefault: 16,
    aiTips: [
      "Use filtered water — machines can't compensate for bad water.",
      "Clean your machine monthly to avoid stale, bitter flavors.",
    ],
    videos: [],
  },
];
