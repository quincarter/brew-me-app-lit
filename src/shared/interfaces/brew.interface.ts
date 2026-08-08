export interface ISavedBrew {
  id: number;
  brewType: string;
  ratio: number;
  water: number;
  coffee: number;
  oz: number;
  /** Epoch ms when this ratio was first saved - used to compute the real day streak. */
  createdAt: number;
}

/**
 * A brew's numbers without persistence metadata - what `addSavedBrew` takes
 * in, and what a `/share` link's query params carry (see `share.utility.ts`).
 */
export type IShareableBrew = Omit<ISavedBrew, "id" | "createdAt">;

/** A curated YouTube walkthrough shown on a brew guide's detail screen. */
export interface IBrewVideo {
  /** The YouTube video ID, e.g. "4tQG_aMcCL0" from https://youtu.be/4tQG_aMcCL0 */
  youtubeId: string;
  title: string;
  /** Who made it, e.g. "James Hoffmann" - shown under the title. */
  channel: string;
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
   * Optional pointer to an external recipe collection (currently only
   * AeroPress, which links to the World AeroPress Championship archive).
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
