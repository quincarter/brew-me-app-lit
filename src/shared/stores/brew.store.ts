import { computed } from "@lit-labs/preact-signals";
import type { ISavedBrew } from "../interfaces/brew.interface";
import { persistentSignal } from "./persistent-signal";

/** No seed data - a fresh install starts with nothing saved. */
export const savedBrewsSignal = persistentSignal<ISavedBrew[]>([], { key: "saved-brews" });

export const totalBrewsSignal = computed(() => savedBrewsSignal.value.length);

export const recentBrewsSignal = computed(() => savedBrewsSignal.value.slice(-2));

const dayKey = (timestamp: number): string => new Date(timestamp).toDateString();

/**
 * Real (not mocked) day streak: consecutive calendar days, ending today,
 * with at least one ratio saved. Saving nothing today resets it to 0, same
 * as typical daily-streak semantics.
 */
export const streakDaysSignal = computed(() => {
  const savedDays = new Set(savedBrewsSignal.value.map((brew) => dayKey(brew.createdAt)));
  if (savedDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (savedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
});

export const getSavedBrewById = (id: number): ISavedBrew | undefined =>
  savedBrewsSignal.value.find((brew) => brew.id === id);

export const addSavedBrew = (brew: Omit<ISavedBrew, "id" | "createdAt">): void => {
  const now = Date.now();
  savedBrewsSignal.value = [...savedBrewsSignal.value, { ...brew, id: now, createdAt: now }];
};

export const updateSavedBrew = (id: number, patch: Partial<Omit<ISavedBrew, "id">>): void => {
  savedBrewsSignal.value = savedBrewsSignal.value.map((brew) =>
    brew.id === id ? { ...brew, ...patch } : brew,
  );
};

export const deleteSavedBrew = (id: number): void => {
  savedBrewsSignal.value = savedBrewsSignal.value.filter((brew) => brew.id !== id);
};

/** Danger-zone reset: clears every saved ratio. Used by the Settings screen. */
export const deleteAllSavedBrews = (): void => {
  savedBrewsSignal.value = [];
};
