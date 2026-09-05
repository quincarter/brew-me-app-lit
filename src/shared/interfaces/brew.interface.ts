export interface ISavedBrew {
  id: number;
  brewType: string;
  /** Optional icon key (a `BREW_ICON_MAP` key from `brew-icon.utility.ts`) chosen at creation time for a custom brew type that doesn't already map to a stock icon. Unset means "use the automatic brewType → icon mapping, or fall back to an initial letter." */
  icon?: string;
  /** Optional free-form name a user gives a brew, e.g. "Sunday morning pour". Falls back to `brewType` for display when unset. */
  name?: string;
  ratio: number;
  water: number;
  coffee: number;
  oz: number;
  /** Epoch ms when this ratio was first saved - used to compute the real day streak. */
  createdAt: number;
  /** Optional 1-5 star rating, set via the Saved Ratio Detail edit flow. */
  rating?: number;
  /** Optional short tasting note, set via the Saved Ratio Detail edit flow. */
  tastingNote?: string;
  /** Epoch ms when this brew was last re-brewed via "Brew again" - falls back to `createdAt` for ordering/display when unset. */
  lastBrewedAt?: number;
  /** Optional method-specific step sequence (bloom/steep/plunge, etc.) - only present for brew types with a real step sequence. See `BREW_STEPS_PRESETS`. */
  brewSteps?: IBrewStepsConfig;
  /** Optional provenance for `brewSteps`/the ratio numbers when they were loaded from a curated recipe (e.g. a WAC AeroPress entry) rather than typed in by hand. */
  recipeSource?: ILoadedRecipeSource;
}

/**
 * A brew's numbers without persistence metadata - what `addSavedBrew` takes
 * in, and what a `/share` link's query params carry (see `share.utility.ts`).
 * Rating/tasting note are edit-only annotations on an already-saved brew, so
 * they're excluded here too - they must never leak into the share-link flow.
 */
export type IShareableBrew = Omit<ISavedBrew, "id" | "createdAt" | "rating" | "tastingNote">;

/**
 * One row in a `IBrewStepsConfig` - a method's timed phase (e.g. "Bloom",
 * 30s) or an untimed setting/instruction (e.g. "Position" -> "Standard", or
 * a WAC recipe's prose step). Timed and untimed rows share one shape so a
 * curated recipe's steps and a method's canned timeline can live in the
 * same list.
 */
export interface IBrewStep {
  /** Stable per-row id so edits/removals target the right row even after reordering. */
  id: string;
  label: string;
  kind: "timed" | "note";
  /** Set when `kind` is "timed". `null` marks an untimed point in the sequence (e.g. "now"). */
  seconds?: number | null;
  /** Set when `kind` is "note" - free-text value, e.g. "Standard", "Paper". */
  value?: string;
  /** Optional short sub-copy shown under the label, e.g. "Wet all grounds, gentle swirl". */
  note?: string;
}

/** A method's editable step sequence, shown in the Calculator/Saved Detail's collapsible Brew Steps card. */
export interface IBrewStepsConfig {
  steps: IBrewStep[];
}

/** Snapshot of a curated recipe (currently only WAC AeroPress entries) at the moment it was loaded into the calculator - drives the "Pulled from"/"Modified from" banner and the "see the original" comparison. */
export interface ILoadedRecipeSource {
  /** `AEROPRESS_RECIPES[].id` this was loaded from. */
  recipeId: string;
  /** Display label, e.g. "Némo Pop · 2025, 1st place". */
  label: string;
  ratio: number;
  water: number;
  coffee: number;
  steps: IBrewStep[];
}

/** A curated YouTube walkthrough shown on a brew guide's detail screen. */
export interface IBrewVideo {
  /** The YouTube video ID, e.g. "4tQG_aMcCL0" from https://youtu.be/4tQG_aMcCL0 */
  youtubeId: string;
  title: string;
  /** Who made it, e.g. "James Hoffmann" - shown under the title. */
  channel: string;
}

/** One piece of method-specific terminology or a tool, defined in plain language. */
export interface IBrewGlossaryTerm {
  term: string;
  definition: string;
}

/**
 * A paid/affiliate product recommendation shown on a brew guide's detail
 * screen - distinct from `externalLinks`, which is editorial reference
 * material. Rendered with `brew-product-link-card`, which always carries a
 * visible affiliate disclosure.
 */
export interface IBrewProductLink {
  label: string;
  description: string;
  url: string;
}

export interface IBrewGuideItem {
  id: string;
  name: string;
  desc: string;
  ratioHint: string;
  grind: string;
  temp: string;
  ratioDefault: number;
  /** Typical total brew time in seconds, used to drive the Timer screen's guided countdown - omitted for methods (e.g. Cold Brew) whose steep time is far too long for a countdown timer. */
  brewTimeSeconds?: number;
  aiTips: string[];
  /** Hand-picked walkthroughs. Pour-over methods share a common set. */
  videos: IBrewVideo[];
  /**
   * Optional pointer to an external recipe collection browsed in-app - the
   * World AeroPress Championship archive for AeroPress, expert V60 recipes
   * for V60.
   */
  recipesLink?: {
    label: string;
    description: string;
    /** Internal route to the in-app recipe browser. */
    route: string;
  };
  /**
   * Optional pointers to external reference pages for further reading -
   * mostly Roastopedia explainers, plus a same-site "see also" for a
   * related brewer where relevant (e.g. Hario Switch → Clever Dripper).
   * Opens in a new tab, unlike `recipesLink`. Rendered in order.
   */
  externalLinks?: {
    label: string;
    description: string;
    url: string;
  }[];
  /**
   * Optional paid/affiliate product recommendations - e.g. brewing gear
   * available to buy. Rendered separately from `externalLinks` via
   * `brew-product-link-card`, which shows an affiliate disclosure. Unlike
   * `externalLinks`'s editorial "further reading" role, these are
   * monetized links and must always be visually distinguished as such.
   */
  productLinks?: IBrewProductLink[];
  /**
   * Optional method-specific terminology/tools glossary, shown above the
   * video walkthroughs. Currently only populated for espresso.
   */
  glossary?: IBrewGlossaryTerm[];
}

/** One World AeroPress Championship placing, transcribed from the official recipe archive. */
export interface IAeropressRecipe {
  id: string;
  year: number;
  /** 1, 2 or 3 - the podium position this recipe placed. */
  place: number;
  competitor: string;
  country: string;
  /** Setup key/value pairs, e.g. { Position: "Inverted", Dose: "18g" }. */
  setup: Record<string, string>;
  /** Ordered brew steps. */
  steps: string[];
  /** Optional note from the competitor. */
  note?: string;
  /**
   * Hand-derived from `setup.Dose`/`steps` - `setup`'s own Dose/Water text is
   * free-form and inconsistent across entries (bypass water, ranges,
   * split doses), so these are curated once rather than parsed at runtime.
   * Drives "Load a WAC recipe"'s ratio/water/coffee auto-fill.
   */
  doseGrams: number;
  /** Total input water across the whole recipe (brew water + any bypass/dilution), not just what touches the grounds. */
  totalWaterGrams: number;
  /**
   * Hand-curated timed brew sequence derived from this recipe's prose
   * `steps` - lets the Calculator's Brew Steps card and the Timer screen
   * show real phases (Bloom, Pour, Press, ...) instead of a flat dump of
   * every prose line as an untimed note. Like `doseGrams`/`totalWaterGrams`,
   * curated once by hand rather than parsed at runtime: source wording for
   * durations is too inconsistent ("for 20 seconds", "over 1:00", rate
   * ranges like "1.0–2.0 g/s") to parse reliably, and a live timer showing a
   * wrong duration is worse than a plain note. Only an instruction with an
   * explicit, unambiguous duration in the source becomes `kind: "timed"`;
   * everything else (rates, ranges, taste-to-preference dilution) stays
   * `kind: "note"` rather than guess. Omitted only for a recipe that hasn't
   * been curated yet - `loadAeropressRecipeIntoCalculator` falls back to the
   * flat prose dump in that case.
   */
  timedSteps?: IBrewStep[];
}

/**
 * One named creator's AeroPress recipe that isn't a World AeroPress
 * Championship entry, transcribed from an external source - same shape as
 * the pour-over "named expert" recipes below, since it's rendered by the
 * same `brew-pourover-recipe-card` and shares its generic setup/ratio
 * parsing.
 */
export interface IAeropressExpertRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  timedSteps?: IBrewStep[];
}

/** One named expert or brand's V60 recipe, transcribed from an external source. */
export interface IV60Recipe {
  id: string;
  /** e.g. "Scott Rao", "Hario" - a person or brand, not necessarily an individual. */
  author: string;
  /** The recipe's own name, e.g. "Spin to Win", "The 4:6 Method". */
  title: string;
  /** Setup key/value pairs, e.g. { Dose: "22g", Water: "360g" } - only the fields the source specifies. */
  setup: Record<string, string>;
  /** Ordered brew steps. */
  steps: string[];
  /** Optional note or caveat from the source. */
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/** One named expert, champion, or brand's Origami recipe, transcribed from an external source. */
export interface IOrigamiRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/** One named expert, champion, or brand's Kalita Wave recipe, transcribed from an external source. */
export interface IKalitaWaveRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/** One named expert, champion, or brand's Chemex recipe, transcribed from an external source. */
export interface IChemexRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/** One named expert, champion, or brand's Clever Dripper recipe, transcribed from an external source. */
export interface ICleverDripperRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/** One named expert, champion, or brand's Hario Switch recipe, transcribed from an external source. */
export interface IHarioSwitchRecipe {
  id: string;
  author: string;
  title: string;
  setup: Record<string, string>;
  steps: string[];
  note?: string;
  /** Hand-curated timed brew sequence derived from this recipe's steps for the timer to ingest. */
  timedSteps?: IBrewStep[];
}

/**
 * A standard named espresso pull style (ristretto, double, lungo, ...) - a
 * fixed dose/ratio/yield/shot-time combination with no machine-specific
 * technique (no preinfusion, grind, or water temp of its own). See
 * `IEspressoProfile` for the technique-driven counterpart.
 */
export interface IEspressoShotStyle {
  id: string;
  label: string;
  ratio: number;
  doseIn: number;
  doseOut: number;
  shotTimeSec: number;
  /** Short description shown on the Espresso Recipes screen and as a Brew Steps note, e.g. "Ristretto — 1:1–1.5, 20–25s, concentrated and syrupy." */
  blurb: string;
}

/**
 * A named espresso technique/profile (blooming espresso, turbo shot, ...) -
 * unlike `IEspressoShotStyle`, carries its own preinfusion time, grind, and
 * water temp since the technique itself is the point, not just the ratio.
 */
export interface IEspressoProfile {
  id: string;
  name: string;
  ratio: number;
  doseIn: number;
  doseOut: number;
  shotTimeSec: number;
  preinfusionSec: number;
  grind: string;
  waterTemp: string;
  tagline: string;
  /** Optional extra instruction that doesn't fit the other fields, e.g. Allongé's "top with hot water to taste". */
  note?: string;
}
