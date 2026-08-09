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
}

/**
 * A brew's numbers without persistence metadata - what `addSavedBrew` takes
 * in, and what a `/share` link's query params carry (see `share.utility.ts`).
 * Rating/tasting note are edit-only annotations on an already-saved brew, so
 * they're excluded here too - they must never leak into the share-link flow.
 */
export type IShareableBrew = Omit<ISavedBrew, "id" | "createdAt" | "rating" | "tastingNote">;

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
}
