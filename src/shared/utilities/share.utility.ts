import { withBase } from "../configuration/base-path";
import type { IShareableBrew } from "../interfaces/brew.interface";
import { getBrewDisplayName } from "./brew-display.utility";

/**
 * Reconstructs a brew from a `/share` link's query string. Returns null if
 * the brew type is missing or any numeric field isn't a positive number -
 * callers show an empty state rather than rendering a broken ratio.
 */
export const parseShareParams = (search: string): IShareableBrew | null => {
  const params = new URLSearchParams(search);
  const brewType = params.get("brewType");
  const name = params.get("name")?.trim();
  const ratio = Number.parseFloat(params.get("ratio") ?? "");
  const water = Number.parseFloat(params.get("water") ?? "");
  const coffee = Number.parseFloat(params.get("coffee") ?? "");
  const oz = Number.parseFloat(params.get("oz") ?? "");

  if (
    !brewType ||
    [ratio, water, coffee, oz].some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    return null;
  }

  return { brewType, ratio, water, coffee, oz, ...(name ? { name } : {}) };
};

/**
 * Builds the absolute, shareable URL for a brew - opens straight to the
 * read-only Share screen. `origin` defaults to the current page's origin so
 * this works unchanged across local dev, preview, and production.
 */
export const buildShareUrl = (
  brew: IShareableBrew,
  origin: string = window.location.origin,
): string => {
  const params = new URLSearchParams({
    brewType: brew.brewType,
    ratio: String(brew.ratio),
    water: String(brew.water),
    coffee: String(brew.coffee),
    oz: String(brew.oz),
  });
  if (brew.name) params.set("name", brew.name);
  return `${origin}${withBase("/share")}?${params.toString()}`;
};

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** User-facing feedback for each `shareBrew` outcome - "cancelled" gets no message since the user chose to back out. */
export const SHARE_OUTCOME_MESSAGES: Record<ShareOutcome, string> = {
  shared: "Shared!",
  copied: "Link copied!",
  cancelled: "",
  failed: "Couldn't share - try again.",
};

/**
 * Shares a brew via the native share sheet where available (mobile Safari/
 * Chrome), falling back to copying the link to the clipboard everywhere
 * else - most desktop browsers don't implement `navigator.share`.
 */
export const shareBrew = async (brew: IShareableBrew): Promise<ShareOutcome> => {
  const url = buildShareUrl(brew);
  const text = `${getBrewDisplayName(brew)} — ${brew.ratio}:1 (${brew.coffee}g coffee, ${brew.water}g water)`;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "BrewMe ratio", text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Some browsers advertise `navigator.share` but reject certain payloads -
      // fall through to the clipboard so the action still does *something*.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
};
