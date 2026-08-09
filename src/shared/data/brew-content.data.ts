import type { IBrewGlossaryTerm, IBrewGuideItem, IBrewVideo } from "../interfaces/brew.interface";

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
  "Hario Switch",
  "Clever Dripper",
];

/** Shared tip video linked from every pour-over dripper's guide, in addition to its own walkthroughs. */
const POUR_OVER_TIP_VIDEO: IBrewVideo = {
  youtubeId: "mMwscUNKbPk",
  title: "How To Avoid A Bad Pour Over Brew",
  channel: "James Hoffmann",
};

const CHEMEX_VIDEOS: IBrewVideo[] = [
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
  POUR_OVER_TIP_VIDEO,
];

const V60_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "PNFVCmxBjQQ",
    title: "The Last V60 Recipe You Will Ever Need",
    channel: "Lance Hedrick",
  },
  {
    youtubeId: "1oB1oDrDkHM",
    title: "A Better 1 Cup V60 Technique",
    channel: "James Hoffmann",
  },
  {
    youtubeId: "Ji4lZTtRAoo",
    title: "Hario V60 Brewguide: Easy and Effective v60 Recipe",
    channel: "Lance Hedrick",
  },
  POUR_OVER_TIP_VIDEO,
];

const KALITA_WAVE_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "c5Zdlni7X00",
    title: "Kalita Wave Brew Guide",
    channel: "The Coffee Chronicler",
  },
  {
    youtubeId: "cFlTVA_B36A",
    title: "Kalita Wave Brew Guide - Super Easy Recipe for the 185",
    channel: "Daddy Got Coffee",
  },
  POUR_OVER_TIP_VIDEO,
];

const ORIGAMI_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "03ZnQsA5c3I",
    title: "Origami Dripper Recipe - The Easy Pulse Pour Coffee",
    channel: "Daddy Got Coffee",
  },
  {
    youtubeId: "f1_Cc2ygvM0",
    title: "Easy Brew Recipe 2023 Championship Method and Technique",
    channel: "Kyle Rowsell",
  },
  POUR_OVER_TIP_VIDEO,
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

const HARIO_SWITCH_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "blQsogeBG7M",
    title: "Hario Switch Brew Guide",
    channel: "Lance Hedrick",
  },
  {
    youtubeId: "QjIvN8mlK9Y",
    title: "My Current Daily Driver: Hario Switch + Sibarist",
    channel: "James Hoffmann",
  },
  POUR_OVER_TIP_VIDEO,
];

const CLEVER_DRIPPER_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "RpOdennxP24",
    title: "The Ultimate Clever Dripper Technique",
    channel: "James Hoffmann",
  },
  POUR_OVER_TIP_VIDEO,
];

const COLD_BREW_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "AB0QLjroFss",
    title: "Everything I Learned About Cold Brew Coffee",
    channel: "James Hoffmann",
  },
  {
    youtubeId: "c1UbW3cKGe0",
    title: "The Cold Brew Recipe You Should Be Making (and it's tasty, obviously)",
    channel: "Morgan Eckroth",
  },
  {
    youtubeId: "gQ3x8qd2dWg",
    title: "Cold Brew 101 | Everything You Need to Know",
    channel: "HomeGrounds Coffee",
  },
  {
    youtubeId: "8K4aHBnpg7Q",
    title: "How to Make Nitro Cold Brew Coffee at Home with Royal Brew",
    channel: "Chris Duke",
  },
];

const ESPRESSO_VIDEOS: IBrewVideo[] = [
  {
    youtubeId: "j-Hu4hF5PTM",
    title: "Guide to Making Great Espresso: Understanding Variables to Dial In Perfectly",
    channel: "Lance Hedrick",
  },
  {
    youtubeId: "lFwJF-_SUr0",
    title: "How I Dial In Espresso",
    channel: "James Hoffmann",
  },
  {
    youtubeId: "xb3IxAr4RCo",
    title: "How I Make Espresso: Tools and Techniques",
    channel: "James Hoffmann",
  },
];

/** Terminology and tools glossary shown on the espresso guide screen, above the video walkthroughs. */
const ESPRESSO_GLOSSARY: IBrewGlossaryTerm[] = [
  {
    term: "RDT (Ross Droplet Technique)",
    definition:
      "Lightly misting your beans with water right before grinding — it cuts down on static so grounds don't cling to the grinder or clump up in the portafilter.",
  },
  {
    term: "WDT (Weiss Distribution Technique)",
    definition:
      "Stirring the grounds in the basket with a fine needle tool before tamping, breaking up clumps so the dose settles into an even, consistent density.",
  },
  {
    term: "Tamping",
    definition:
      "Pressing the dose into a flat, even puck so water has to pass through it uniformly instead of carving out an easier path.",
  },
  {
    term: "Extraction",
    definition:
      "The process of hot water pulling soluble flavor out of the puck — usually tracked by shot time and expressed as the percentage of the dose that ends up dissolved in your cup.",
  },
  {
    term: "Channeling",
    definition:
      "When water finds a crack or soft spot in the puck and rushes through it, leaving the rest of the puck under-extracted and giving you a sour or harsh shot.",
  },
  {
    term: "Dose & Yield",
    definition:
      "Dose is the weight of dry grounds you load into the basket, yield is the weight of liquid espresso you collect — the two together define your brew ratio.",
  },
  {
    term: "Tamper",
    definition:
      "The flat, weighted tool used to compress the dose into a level puck, sized to match your basket's diameter.",
  },
  {
    term: "Portafilter",
    definition:
      'The handled fitting that holds the basket of grounds and locks into the machine\'s group head — a "bottomless" or "naked" portafilter skips the spout, exposing the puck so you can watch the extraction and spot channeling as it happens.',
  },
  {
    term: "Puck Screen",
    definition:
      "A thin metal disc set on top of the puck to spread incoming water evenly and keep the machine's shower screen cleaner for longer.",
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
    videos: V60_VIDEOS,
    recipesLink: {
      label: "5 expert V60 recipes",
      description: "Rao, Hoffmann, Kasuya and more, compared side by side",
      route: "/more/v60-recipes",
    },
    externalLinks: [
      {
        label: "Learn more about the V60",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/hario-v60/",
      },
    ],
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
    videos: CHEMEX_VIDEOS,
    externalLinks: [
      {
        label: "Learn more about the Chemex",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/chemex/",
      },
    ],
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
    externalLinks: [
      {
        label: "Learn more about the French Press",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/french-press/",
      },
    ],
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
    videos: ESPRESSO_VIDEOS,
    glossary: ESPRESSO_GLOSSARY,
    externalLinks: [
      {
        label: "Learn more about espresso",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/espresso/",
      },
      {
        label: "How to pull an espresso shot",
        description: "See also: a step-by-step pulling guide from Roastopedia",
        url: "https://roastopedia.com/how-to-pull-an-espresso-shot/",
      },
    ],
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
    videos: COLD_BREW_VIDEOS,
    externalLinks: [
      {
        label: "Learn more about cold brew",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/cold-brew/",
      },
    ],
    productLinks: [
      {
        label: "Nitro Cold Brew Kegs — Royal Brew",
        description: "A home nitro cold brew kegging system we like",
        url: "https://amzn.to/4wNaC8N",
      },
      {
        label: "GrowlerWerks - uKeg Nitro Cold Brew",
        description:
          "MAKE NITRO AT HOME – the uKeg Nitro brews and infuses to make delicious nitro cold brew Coffee",
        url: "https://amzn.to/4gliHeM",
      },
    ],
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
    externalLinks: [
      {
        label: "Learn more about the AeroPress",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/aeropress/",
      },
    ],
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
    videos: KALITA_WAVE_VIDEOS,
    externalLinks: [
      {
        label: "Learn more about the Kalita Wave",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/kalita-wave/",
      },
    ],
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
    videos: ORIGAMI_VIDEOS,
    externalLinks: [
      {
        label: "Learn more about the Origami dripper",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/origami-dripper/",
      },
    ],
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
    externalLinks: [
      {
        label: "Learn more about drip coffee",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/drip-coffee/",
      },
      {
        label: "Batch brew",
        description: "See also: brewing larger volumes without losing quality",
        url: "https://roastopedia.com/batch-brew/",
      },
    ],
  },
  {
    id: "hario-switch",
    name: "Hario Switch",
    desc: "A hybrid dripper with a valve at the base — steep it closed like an immersion brewer, then flip the switch to let it draw down like a pour-over, all in one device.",
    ratioHint: "15:1",
    grind: "Medium",
    temp: "200°F",
    ratioDefault: 15,
    aiTips: [
      "Keep the switch closed for the full steep, then open it and let gravity do the rest.",
      "A slightly finer grind than a normal pour-over makes up for the shorter drawdown contact time.",
    ],
    videos: HARIO_SWITCH_VIDEOS,
    externalLinks: [
      {
        label: "Clever Dripper",
        description: "See also: a very similar steep-then-release brewer, from Roastopedia",
        url: "https://roastopedia.com/clever-dripper/",
      },
    ],
  },
  {
    id: "clever-dripper",
    name: "Clever Dripper",
    desc: "Looks like a cone dripper, brews like an immersion steeper — a valve at the bottom holds the coffee back until you set it down on your cup or server, then releases a clean, filtered cup.",
    ratioHint: "15:1",
    grind: "Medium",
    temp: "200°F",
    ratioDefault: 15,
    aiTips: [
      "The valve only opens once it's resting on your cup or server, so steep time is fully in your control.",
      "Give it a gentle stir partway through the steep to keep grounds from clumping at the bottom.",
    ],
    videos: CLEVER_DRIPPER_VIDEOS,
    externalLinks: [
      {
        label: "What is a Clever Dripper?",
        description: "Background and brewing notes from Roastopedia",
        url: "https://roastopedia.com/clever-dripper/",
      },
    ],
  },
];
