import type { SVGTemplateResult } from "lit";
import {
  AEROPRESS_ICON,
  CHEMEX_ICON,
  CLEVER_DRIPPER_ICON,
  COLD_BREW_ICON,
  DRIP_ICON,
  ESPRESSO_SHOT_ICON,
  FRENCH_PRESS_ICON,
  HARIO_SWITCH_ICON,
  KALITA_WAVE_ICON,
  MOKA_POT_ICON,
  NITRO_COLD_BREW_ICON,
  ORIGAMI_ICON,
  PERCOLATOR_ICON,
  SIPHON_ICON,
  TURKISH_COFFEE_ICON,
  V60_ICON,
} from "../icons/icons";

/**
 * Default per-brew-method icons, keyed by a hyphenated-lowercase form of the
 * brew type/method name (see `normalizeBrewIconKey`). Covers every stock
 * `BREW_TYPES` entry plus a handful of extra methods that don't have a stock
 * entry yet but are still selectable via the icon picker for custom types.
 */
export const BREW_ICON_MAP: Record<string, SVGTemplateResult> = {
  aeropress: AEROPRESS_ICON,
  chemex: CHEMEX_ICON,
  "clever-dripper": CLEVER_DRIPPER_ICON,
  "cold-brew": COLD_BREW_ICON,
  drip: DRIP_ICON,
  "espresso-shot": ESPRESSO_SHOT_ICON,
  "french-press": FRENCH_PRESS_ICON,
  "hario-switch": HARIO_SWITCH_ICON,
  "kalita-wave": KALITA_WAVE_ICON,
  "moka-pot": MOKA_POT_ICON,
  "nitro-cold-brew": NITRO_COLD_BREW_ICON,
  origami: ORIGAMI_ICON,
  percolator: PERCOLATOR_ICON,
  siphon: SIPHON_ICON,
  "turkish-coffee": TURKISH_COFFEE_ICON,
  v60: V60_ICON,
};

/** One selectable option in an icon picker: a `BREW_ICON_MAP` key plus a human-readable label. */
export interface IBrewIconOption {
  key: string;
  label: string;
}

const toTitleCase = (key: string): string =>
  key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** Every `BREW_ICON_MAP` entry, reconstructed into a human Title Case label - for use in an icon picker. */
export const BREW_ICON_OPTIONS: IBrewIconOption[] = Object.keys(BREW_ICON_MAP).map((key) => ({
  key,
  label: toTitleCase(key),
}));

/** Normalizes a brew type or icon key candidate into the hyphenated-lowercase form used by `BREW_ICON_MAP`. */
export const normalizeBrewIconKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, "-");

/**
 * Resolves the icon to show for a saved brew: an explicit `iconOverride`
 * (from `ISavedBrew.icon`) takes priority if it's a known key, otherwise
 * falls back to the automatic `brewType` -> icon mapping. Returns
 * `undefined` when neither resolves, so callers can fall back to an initial
 * letter.
 */
export const getBrewTypeIcon = (
  brewType: string,
  iconOverride?: string,
): SVGTemplateResult | undefined => {
  if (iconOverride && BREW_ICON_MAP[iconOverride]) {
    return BREW_ICON_MAP[iconOverride];
  }
  return BREW_ICON_MAP[normalizeBrewIconKey(brewType)];
};
