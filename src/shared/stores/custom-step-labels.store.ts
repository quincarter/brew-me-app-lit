import { computed } from "@lit-labs/preact-signals";
import { BREW_STEPS_PRESETS } from "../data/brew-steps-presets.data";
import { persistentSignal } from "./persistent-signal";

/** Deduped set of every canned step label across `BREW_STEPS_PRESETS` - seeds the label dropdown before any custom ones are added. */
export const PRESET_STEP_LABELS = [
  ...new Set(
    Object.values(BREW_STEPS_PRESETS).flatMap((config) => config.steps.map((step) => step.label)),
  ),
];

/**
 * Step labels the person has typed themselves, on top of `PRESET_STEP_LABELS`.
 * Persisted to IndexedDB via the same `persistentSignal` pattern as
 * `brew-types.store.ts`'s `customBrewTypesSignal` - no seed data, starts empty.
 */
export const customStepLabelsSignal = persistentSignal<string[]>([], { key: "custom-step-labels" });

/** Preset labels first, then custom labels in the order they were added. */
export const knownStepLabelsSignal = computed(() => [
  ...PRESET_STEP_LABELS,
  ...customStepLabelsSignal.value,
]);

/**
 * Adds a new custom step label (trimmed, case-insensitively deduped against
 * both the preset and existing custom lists). Returns the label that should
 * end up selected - the newly added one, or the existing matching one if it
 * was a duplicate - or `null` if the input was blank.
 */
export const addCustomStepLabel = (label: string): string | null => {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const existing = knownStepLabelsSignal.value.find(
    (known) => known.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  customStepLabelsSignal.value = [...customStepLabelsSignal.value, trimmed];
  return trimmed;
};
