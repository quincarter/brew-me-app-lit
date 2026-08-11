import { computed } from "@lit-labs/preact-signals";
import type {
  IAeropressRecipe,
  IOrigamiRecipe,
  IShareableBrew,
  ISavedBrew,
  IV60Recipe,
} from "../interfaces/brew.interface";
import {
  getAeropressRecipeLabel,
  getAeropressRecipeRatio,
  getAeropressRecipeSteps,
} from "../utilities/aeropress-recipe.utility";
import {
  getPouroverRecipeLabel,
  getPouroverRecipeRatio,
  getPouroverRecipeSteps,
  parseDoseGrams,
  parseWaterGrams,
} from "../utilities/pourover-recipe.utility";
import { gramsToOunces } from "../utilities/ratio.utility";
import { persistentSignal } from "./persistent-signal";
import { openPostSaveSheet } from "./post-save-sheet.store";

/** No seed data - a fresh install starts with nothing saved. */
export const savedBrewsSignal = persistentSignal<ISavedBrew[]>([], { key: "saved-brews" });

export const totalBrewsSignal = computed(() => savedBrewsSignal.value.length);

/** Number of most-recently-active brews surfaced by recentSavedBrewsSignal. */
const RECENT_BREWS_LIMIT = 4;

/**
 * All saved brews sorted with the most recently active brews first (by `lastBrewedAt` falling back to `createdAt`).
 */
export const sortedSavedBrewsSignal = computed(() =>
  [...savedBrewsSignal.value].sort(
    (a, b) => (b.lastBrewedAt ?? b.createdAt) - (a.lastBrewedAt ?? a.createdAt),
  ),
);

/**
 * The most recently *active* brews, newest first, capped for "Recent brews"
 * style sections - ordered by `lastBrewedAt` (falling back to `createdAt`
 * for a brew that's never been re-brewed), not by save order, so re-brewing
 * an older saved ratio surfaces it here again.
 */
export const recentSavedBrewsSignal = computed(() =>
  sortedSavedBrewsSignal.value.slice(0, RECENT_BREWS_LIMIT),
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

/**
 * The "Brew this recipe now" action on the WAC Recipes screen: saves a
 * curated AeroPress recipe as a brand-new brew (auto-filled numbers, its
 * curated step sequence, and recipe provenance for the "Pulled from"
 * banner), then opens the post-save sheet so the user can jump straight
 * into a guided timer or view the new brew's detail screen.
 */
export const brewAeropressRecipeNow = (recipe: IAeropressRecipe): void => {
  const ratio = getAeropressRecipeRatio(recipe);
  const steps = getAeropressRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Aeropress",
    name: `${recipe.competitor} · ${recipe.year}`,
    ratio,
    water: recipe.totalWaterGrams,
    coffee: recipe.doseGrams,
    oz: gramsToOunces(recipe.totalWaterGrams),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getAeropressRecipeLabel(recipe),
      ratio,
      water: recipe.totalWaterGrams,
      coffee: recipe.doseGrams,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated V60 recipe as a brand-new brew and opens post-save sheet. */
export const brewV60RecipeNow = (recipe: IV60Recipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "V60",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Saves a curated Origami recipe as a brand-new brew and opens post-save sheet. */
export const brewOrigamiRecipeNow = (recipe: IOrigamiRecipe): void => {
  const dose = parseDoseGrams(recipe);
  const water = parseWaterGrams(recipe);
  const ratio = getPouroverRecipeRatio(recipe);
  const steps = getPouroverRecipeSteps(recipe);

  const savedBrew = addSavedBrew({
    brewType: "Origami",
    name: `${recipe.author} · ${recipe.title}`,
    ratio,
    water,
    coffee: dose,
    oz: gramsToOunces(water),
    brewSteps: { steps },
    recipeSource: {
      recipeId: recipe.id,
      label: getPouroverRecipeLabel(recipe),
      ratio,
      water,
      coffee: dose,
      steps,
    },
  });

  openPostSaveSheet(savedBrew);
};

/** Danger-zone reset: clears every saved ratio. Used by the Settings screen. */
export const deleteAllSavedBrews = (): void => {
  savedBrewsSignal.value = [];
};
