import type {
  IBrewTypeFeatures,
  TelemetryDisplayMode,
} from "../interfaces/brew-type-features.interface";
import { persistentSignal } from "./persistent-signal";

/** Applied to every brew type unless overridden in `brewTypeFeaturesSignal` (or locked, below). */
const DEFAULT_BREW_TYPE_FEATURES: IBrewTypeFeatures = {
  showShotsSection: true,
  telemetryMode: "full",
};

/**
 * Forced for brew types that genuinely can't support these features yet -
 * keyed by brew type name so it's a single place to extend as more methods
 * are added, rather than scattered string-equality checks. Aeropress has no
 * pressure gauge and you'd be pressing on the scale instead of getting a
 * clean weight reading, so device telemetry can't be tracked for it.
 */
const UNSUPPORTED_TELEMETRY_BREW_TYPES = new Set<string>(["Aeropress"]);

const LOCKED_BREW_TYPE_FEATURES: IBrewTypeFeatures = {
  showShotsSection: false,
  telemetryMode: "off",
};

/**
 * Per-brew-type overrides of `DEFAULT_BREW_TYPE_FEATURES`, keyed by brew type
 * name. Persisted to IndexedDB via the same `persistentSignal` pattern as
 * `savedBrewsSignal` - no seed data, starts empty (every brew type falls
 * back to the default until explicitly changed on the Settings screen).
 */
export const brewTypeFeaturesSignal = persistentSignal<Record<string, IBrewTypeFeatures>>(
  {},
  { key: "brew-type-features" },
);

/** Whether `brewType`'s features are locked (forced off, non-editable) rather than user-configurable. */
export function isBrewTypeFeaturesLocked(brewType: string): boolean {
  return UNSUPPORTED_TELEMETRY_BREW_TYPES.has(brewType);
}

/**
 * Resolves the effective features for `brewType`: the locked-off object for
 * an unsupported type, else the stored override merged over the default,
 * else the default itself.
 */
export function getBrewTypeFeatures(brewType: string): IBrewTypeFeatures {
  if (isBrewTypeFeaturesLocked(brewType)) return LOCKED_BREW_TYPE_FEATURES;

  const override = brewTypeFeaturesSignal.value[brewType];
  if (!override) return DEFAULT_BREW_TYPE_FEATURES;

  return { ...DEFAULT_BREW_TYPE_FEATURES, ...override };
}

export function setShowShotsSection(brewType: string, value: boolean): void {
  if (isBrewTypeFeaturesLocked(brewType)) return;

  const current = getBrewTypeFeatures(brewType);
  brewTypeFeaturesSignal.value = {
    ...brewTypeFeaturesSignal.value,
    [brewType]: { ...current, showShotsSection: value },
  };
}

export function setTelemetryMode(brewType: string, mode: TelemetryDisplayMode): void {
  if (isBrewTypeFeaturesLocked(brewType)) return;

  const current = getBrewTypeFeatures(brewType);
  brewTypeFeaturesSignal.value = {
    ...brewTypeFeaturesSignal.value,
    [brewType]: { ...current, telemetryMode: mode },
  };
}
