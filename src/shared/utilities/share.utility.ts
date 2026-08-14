import { withBase } from "../configuration/base-path";
import type { IBrewStep, IBrewStepsConfig, IShareableBrew } from "../interfaces/brew.interface";
import {
  applyBrewStepsDiff,
  computeBrewStepsDiff,
  type IBrewStepFieldChange,
  type IBrewStepsDiff,
} from "./brew-steps-diff.utility";
import { getBrewDisplayName } from "./brew-display.utility";
import { formatRatio } from "./format-ratio.utility";
import { stepsEqual } from "./recipe-modified.utility";
import { buildRecipeSource } from "./recipe-registry.utility";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isBrewStep = (value: unknown): value is IBrewStep =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.label === "string" &&
  (value.kind === "timed" || value.kind === "note");

const isBrewStepsConfig = (value: unknown): value is IBrewStepsConfig =>
  isRecord(value) && Array.isArray(value.steps) && value.steps.every(isBrewStep);

const isBrewStepFieldChange = (value: unknown): value is IBrewStepFieldChange =>
  isRecord(value) && typeof value.id === "string";

const isBrewStepsDiff = (value: unknown): value is IBrewStepsDiff =>
  isRecord(value) &&
  (value.changed === undefined ||
    (Array.isArray(value.changed) && value.changed.every(isBrewStepFieldChange))) &&
  (value.added === undefined || (Array.isArray(value.added) && value.added.every(isBrewStep))) &&
  (value.removed === undefined ||
    (Array.isArray(value.removed) && value.removed.every((id) => typeof id === "string"))) &&
  (value.order === undefined ||
    (Array.isArray(value.order) && value.order.every((id) => typeof id === "string")));

/**
 * Reconstructs a brew from a `/share` link's query string. Returns null if
 * the brew type is missing or any numeric field isn't a positive number -
 * callers show an empty state rather than rendering a broken ratio.
 *
 * `recipe`, when present, is just a `recipeId` - both ends of the link ship
 * the same bundled curated-recipe data, so the full label/ratio/water/
 * coffee/steps snapshot is rebuilt locally via `buildRecipeSource` rather
 * than transmitted. A modified recipe's steps arrive as `diff` - a compact
 * `IBrewStepsDiff` (see `brew-steps-diff.utility.ts`) applied back onto the
 * reconstructed original - rather than the full modified array; `steps` (a
 * full `IBrewStepsConfig`) is only used for a brew with no recipe at all
 * (nothing to diff against). An unmodified recipe share sends neither `diff`
 * nor `steps`, reconstructing `brewSteps` straight from the recipe lookup. A
 * corrupted/unrecognized `steps`, `diff`, or `recipe` value is dropped
 * rather than failing the whole link - the ratio numbers still come through.
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

  const recipeSource = buildRecipeSource(params.get("recipe") ?? "") ?? undefined;
  const explicitBrewSteps = parseJsonParam(params.get("steps"), isBrewStepsConfig);
  const stepsDiff = parseJsonParam(params.get("diff"), isBrewStepsDiff);

  const brewSteps =
    explicitBrewSteps ??
    (stepsDiff && recipeSource
      ? { steps: applyBrewStepsDiff(recipeSource.steps, stepsDiff) }
      : undefined) ??
    (recipeSource ? { steps: recipeSource.steps } : undefined);

  return {
    brewType,
    ratio,
    water,
    coffee,
    oz,
    ...(name ? { name } : {}),
    ...(brewSteps ? { brewSteps } : {}),
    ...(recipeSource ? { recipeSource } : {}),
  };
};

/** Parses a JSON query param and validates its shape via `isValid` - a syntactically-valid but wrong-shaped value (e.g. a hand-edited link) is dropped, same as malformed JSON. */
const parseJsonParam = <T>(
  value: string | null,
  isValid: (parsed: unknown) => parsed is T,
): T | null => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Builds the absolute, shareable URL for a brew - opens straight to the
 * read-only Share screen. `origin` defaults to the current page's origin so
 * this works unchanged across local dev, preview, and production.
 *
 * `recipeSource` is carried as just its `recipeId` - the receiving end
 * rebuilds the full snapshot via `buildRecipeSource`, since the curated
 * recipe data is bundled into every install rather than served from
 * anywhere. When the brew's steps were hand-edited after loading a recipe,
 * only the diff against that recipe's steps is sent (`diff`), not the full
 * modified array - most edits touch one or two rows, so this is far
 * smaller than re-sending every untouched row. `steps` (the full array) is
 * only used when there's no recipe to diff against at all. An unmodified
 * recipe share sends neither.
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
  if (brew.recipeSource) params.set("recipe", brew.recipeSource.recipeId);

  if (brew.brewSteps && brew.recipeSource) {
    if (!stepsEqual(brew.brewSteps.steps, brew.recipeSource.steps)) {
      const diff = computeBrewStepsDiff(brew.recipeSource.steps, brew.brewSteps.steps);
      params.set("diff", JSON.stringify(diff));
    }
  } else if (brew.brewSteps) {
    params.set("steps", JSON.stringify(brew.brewSteps));
  }

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
  const text = `${getBrewDisplayName(brew)} — ${formatRatio(brew.ratio)} (${brew.coffee}g coffee, ${brew.water}g water)`;

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
