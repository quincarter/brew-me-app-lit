import { computed } from "@lit-labs/preact-signals";
import { BREW_TYPES } from "../data/brew-content.data";
import { persistentSignal } from "./persistent-signal";

/**
 * Brew types the person has added themselves, on top of the stock
 * `BREW_TYPES` list. Persisted to IndexedDB via the same `persistentSignal`
 * pattern as `savedBrewsSignal` - no seed data, starts empty.
 */
export const customBrewTypesSignal = persistentSignal<string[]>([], { key: "custom-brew-types" });

/** Stock types first, then custom types in the order they were added. */
export const allBrewTypesSignal = computed(() => [...BREW_TYPES, ...customBrewTypesSignal.value]);

/**
 * Adds a new custom brew type (trimmed, case-insensitively deduped against
 * both the stock and existing custom lists). Returns the name that should
 * end up selected - the newly added one, or the existing matching one if it
 * was a duplicate - or `null` if the input was blank.
 */
export const addCustomBrewType = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = allBrewTypesSignal.value.find(
    (type) => type.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  customBrewTypesSignal.value = [...customBrewTypesSignal.value, trimmed];
  return trimmed;
};

export const deleteCustomBrewType = (name: string): void => {
  customBrewTypesSignal.value = customBrewTypesSignal.value.filter((type) => type !== name);
};

export const deleteAllCustomBrewTypes = (): void => {
  customBrewTypesSignal.value = [];
};
