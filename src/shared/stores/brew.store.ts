import { computed } from "@lit-labs/preact-signals";
import type { IShareableBrew, ISavedBrew } from "../interfaces/brew.interface";
import { persistentSignal } from "./persistent-signal";
import { openPostSaveSheet } from "./post-save-sheet.store";

/** No seed data - a fresh install starts with nothing saved. */
export const savedBrewsSignal = persistentSignal<ISavedBrew[]>([], { key: "saved-brews" });

export const totalBrewsSignal = computed(() => savedBrewsSignal.value.length);

/** Number of most-recently-active brews surfaced by recentSavedBrewsSignal. */
const RECENT_BREWS_LIMIT = 4;

/**
 * The most recently *active* brews, newest first, capped for "Recent brews"
 * style sections - ordered by `lastBrewedAt` (falling back to `createdAt`
 * for a brew that's never been re-brewed), not by save order, so re-brewing
 * an older saved ratio surfaces it here again.
 */
export const recentSavedBrewsSignal = computed(() =>
  [...savedBrewsSignal.value]
    .sort((a, b) => (b.lastBrewedAt ?? b.createdAt) - (a.lastBrewedAt ?? a.createdAt))
    .slice(0, RECENT_BREWS_LIMIT),
);

/** The single most recently brewed saved brew, or null when nothing's saved yet - drives Home's featured "Brew again" card. */
export const mostRecentlyBrewedSignal = computed(() => recentSavedBrewsSignal.value[0] ?? null);

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

export const addSavedBrew = (brew: IShareableBrew): ISavedBrew => {
  const now = Date.now();
  const savedBrew = { ...brew, id: now, createdAt: now };
  savedBrewsSignal.value = [...savedBrewsSignal.value, savedBrew];
  return savedBrew;
};

export const updateSavedBrew = (id: number, patch: Partial<Omit<ISavedBrew, "id">>): void => {
  savedBrewsSignal.value = savedBrewsSignal.value.map((brew) =>
    brew.id === id ? { ...brew, ...patch } : brew,
  );
};

export const deleteSavedBrew = (id: number): void => {
  savedBrewsSignal.value = savedBrewsSignal.value.filter((brew) => brew.id !== id);
};

/** Stamps a brew as brewed right now - used by "Brew again" so recency ordering reflects actual use, not just save order. */
export const markBrewedNow = (id: number): void => {
  updateSavedBrew(id, { lastBrewedAt: Date.now() });
};

/**
 * The "Brew again" action, available from Home, Saved Brews, Saved Ratio
 * Detail, and the Calculator's own recent-brews strip: stamps the brew as
 * brewed now and opens the post-save sheet so the user can jump into a
 * guided timer or view the brew's detail - without routing back through
 * Save, which would create a duplicate entry instead of updating this one.
 */
export const brewAgain = (brew: ISavedBrew, options?: { alreadyOnDetail?: boolean }): void => {
  markBrewedNow(brew.id);
  openPostSaveSheet(brew, options);
};

/** Danger-zone reset: clears every saved ratio. Used by the Settings screen. */
export const deleteAllSavedBrews = (): void => {
  savedBrewsSignal.value = [];
};
